import {
  collection,
  doc,
  DocumentData,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { sendAligoMessage } from "../aligo.server";
import { addLog, getPartnerProfile } from "./firebase.server";
import { firestore } from "./firebaseInit.server";
import { OrderItem } from "~/components/order";
import { dateToDayStr, getTimezoneDate } from "~/utils/date";

/**
 * 운송장이 기입된 주문서들을 공유합니다.
 * @param dayStr: 날짜 (XXXX-XX-XX), orders: 운송장 기입된 주문서 목록
 * 1. 해당 주문서의 운송장 내용이 업데이트되고,
 * 2. 그 주문서에 해당하는 지연주문건이 삭제되며,
 * 3. 운송장을 공유한 날짜에 완료운송장 항목을 추가합니다. (수정일 경우 삭제 후 재등록)
 */
export async function addWaybills({
  dayStr,
  orders,
}: {
  orders: OrderItem[];
  dayStr: string;
}) {
  if (orders.length == 0) {
    return "오류: 입력된 운송장이 없습니다.";
  }

  try {
    let waybillBatch = writeBatch(firestore);

    let day = getTimezoneDate(new Date());
    day.setDate(day.getDate() + 1);
    const nextDayStr = dateToDayStr(day);

    for (let i = 0; i < orders.length; i++) {
      const item = orders[i];

      //items에 해당 주문서 아이템 찾은 후 택배사, 송장번호 정보 기입
      const ordersRef = collection(firestore, `orders/${dayStr}/items`);

      //기존 주문서 탐색
      const idQuery = query(
        ordersRef,
        where("amount", "==", item.amount),
        where("customsCode", "==", item.customsCode),
        where("deliveryRequest", "==", item.deliveryRequest),
        where("managementNumber", "==", item.managementNumber),
        where("optionName", "==", item.optionName),
        where("orderNumber", "==", item.orderNumber),
        where("providerName", "==", item.providerName),
        where("phone", "==", item.phone),
        where("productName", "==", item.productName),
        where("receiver", "==", item.receiver),
        where("seller", "==", item.seller),
        where("zipCode", "==", item.zipCode),
        limit(1)
      );
      const querySnap = await getDocs(idQuery);

      if (querySnap.empty) {
        return "오류: 입력한 운송장에 해당하는 주문건을 찾을 수 없습니다.";
      }

      querySnap.forEach(async (document) => {
        const docName = document.id;

        //기존에 운송장 입력한 기록이 있으면 날짜 확인
        const prevWaybillSharedDate = document.data().waybillSharedDate;

        //주문서에 운송장 내용 기입
        waybillBatch.update(document.ref, {
          shippingCompany: item.shippingCompany,
          waybillNumber: item.waybillNumber,
          waybillSharedDate: nextDayStr,
        });

        //지연주문건에서도 삭제
        let delayedOrderItemDocRef = doc(firestore, `delayed-orders`, docName);
        waybillBatch.delete(delayedOrderItemDocRef);

        //다른 날짜에 운송장이 이미 있으면 삭제
        if (
          prevWaybillSharedDate !== undefined &&
          prevWaybillSharedDate.length > 0 &&
          prevWaybillSharedDate !== nextDayStr
        ) {
          let prevWaybillDocRef = doc(
            firestore,
            `waybills/${prevWaybillSharedDate}/items`,
            docName
          );
          waybillBatch.delete(prevWaybillDocRef);
        }

        //완료운송장에 추가
        let waybillItemDocRef = doc(
          firestore,
          `waybills/${nextDayStr}/items`,
          docName
        );
        waybillBatch.set(waybillItemDocRef, {
          ...item,
          waybillSharedDate: nextDayStr,
        });
      });

      if ((i % 100 == 1 && i > 1) || i == orders.length - 1) {
        await waybillBatch.commit();
        if (i < orders.length) {
          waybillBatch = writeBatch(firestore);
        }
      }
    }

    await setDoc(doc(firestore, `waybills/${nextDayStr}`), {
      isShared: true,
    });
    addLog("addWaybills", { dayStr: dayStr, orders: orders.toString() });
    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 해당 날짜의 모든 운송장 정보를 불러옵니다
 * @param dayStr: 날짜 (XXXX-XX-XX)
 * @returns
 *  Array of OrderItem
 */
export async function getAllWaybills(dayStr: string) {
  const ordersRef = collection(firestore, `waybills/${dayStr}/items`);
  const ordersQuery = query(ordersRef, orderBy("managementNumber"));
  const querySnap = await getDocs(ordersQuery);
  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 해당 개월 모든 운송장 정보를 불러옵니다
 * @param dayStr: 개월 (XXXX-XX)
 * @returns
 *  Array of OrderItem
 */
export async function getMonthWaybills(month: string) {
  const dataList: DocumentData[] = [];
  for (let i = 1; i <= 31; i++) {
    const day = i.toString().padStart(2, "0");
    const dayStr = month + "-" + day;
    const ordersRef = collection(firestore, `waybills/${dayStr}/items`);
    const ordersQuery = query(ordersRef, orderBy("managementNumber"));
    const querySnap = await getDocs(ordersQuery);
    querySnap.docs.forEach((doc) => dataList.push(doc.data()));
  }
  return dataList;
}

/**
 * 해당 날짜의, 지정된 파트너의 운송장 정보를 불러옵니다
 * @param dayStr: 날짜 (XXXX-XX-XX), partnerName: 파트너 이름
 * @returns
 *  Array of OrderItem
 */
export async function getPartnerWaybills({
  dayStr,
  partnerName,
}: {
  dayStr: string;
  partnerName: string;
}) {
  const ordersRef = collection(firestore, `waybills/${dayStr}/items`);

  const partnerProfile = await getPartnerProfile({ name: partnerName });
  if (!partnerProfile) {
    return [];
  }

  const providerName = partnerProfile.providerName;

  const ordersQuery = query(
    ordersRef,
    where("providerName", "==", providerName),
    orderBy("managementNumber")
  );
  const querySnap = await getDocs(ordersQuery);

  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 운송장을 수정하여 다시 공유합니다.
 * @param dayStr: 운송장 공유 날짜 (XXXX-XX-XX), waybills: 운송장  목록
 * 1. 해당 운송장 내용이 업데이트되고,
 * 2. 운송장의 원 주문서를 수정합니다.
 */
export async function editWaybills({
  dayStr,
  waybills,
}: {
  waybills: OrderItem[];
  dayStr: string;
}) {
  if (waybills.length == 0) {
    return "오류: 입력된 운송장이 없습니다.";
  }

  try {
    let waybillBatch = writeBatch(firestore);

    let nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = dateToDayStr(nextDay);

    for (let i = 0; i < waybills.length; i++) {
      const item = waybills[i];

      const waybillsRef = collection(firestore, `waybills/${dayStr}/items`);

      //기존 운송장 탐색
      const idQuery = query(
        waybillsRef,
        where("amount", "==", item.amount),
        where("customsCode", "==", item.customsCode),
        where("deliveryRequest", "==", item.deliveryRequest),
        where("managementNumber", "==", item.managementNumber),
        where("optionName", "==", item.optionName),
        where("orderNumber", "==", item.orderNumber),
        where("providerName", "==", item.providerName),
        where("phone", "==", item.phone),
        where("productName", "==", item.productName),
        where("receiver", "==", item.receiver),
        where("seller", "==", item.seller),
        where("zipCode", "==", item.zipCode),
        limit(1)
      );
      const querySnap = await getDocs(idQuery);

      if (querySnap.empty) {
        console.log("error: not found");
        return "오류: 수정을 요청한 운송장을 찾을 수 없습니다.";
      }

      querySnap.forEach(async (document) => {
        const docName = document.id;

        //운송장의 원 주문서가 공유된 날짜
        const orderSharedDate = document.data().orderSharedDate;

        //기존 운송장이 공유된 날짜가 다르면 그 운송장 삭제
        if (dayStr !== nextDayStr) {
          waybillBatch.delete(document.ref);
        }

        //완료운송장에 추가(수정)
        let waybillItemDocRef = doc(
          firestore,
          `waybills/${nextDayStr}/items`,
          docName
        );

        waybillBatch.set(waybillItemDocRef, {
          ...item,
          waybillSharedDate: nextDayStr,
        });

        //원 주문서 수정

        let orderItemDocRef = doc(
          firestore,
          `orders/${orderSharedDate}/items`,
          docName
        );

        waybillBatch.update(orderItemDocRef, {
          shippingCompany: item.shippingCompany,
          waybillNumber: item.waybillNumber,
          waybillSharedDate: nextDayStr,
        });
      });

      if ((i % 130 == 1 && i > 1) || i == waybills.length - 1) {
        await waybillBatch.commit();
        if (i < waybills.length - 1) {
          waybillBatch = writeBatch(firestore);
        }
      }
    }

    await setDoc(doc(firestore, `waybills/${nextDayStr}`), {
      isShared: true,
    });
    addLog("editWaybills", { dayStr: dayStr, waybills: waybills.toString() });
    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 이전날 공유된 (즉 오늘날로 등록된) 운송장 건수를 불러옵니다.
 * @returns
 */
export async function getTodayWaybillsCount() {
  const today = dateToDayStr(new Date());
  const waybillsRef = collection(firestore, `waybills/${today}/items`);
  const snapshot = await getCountFromServer(waybillsRef);
  return snapshot.data().count;
}

/**
 * 해당 파트너가 이전날 공유한 (즉 오늘날로 등록된) 운송장 건수를 불러옵니다.
 * @param partnerName: 파트너명
 * @returns
 */
export async function getPartnerTodayWaybillsCount(providerName: string) {
  const today = dateToDayStr(new Date());
  const waybillsRef = collection(firestore, `waybills/${today}/items`);
  const waybillQuery = query(
    waybillsRef,
    where("providerName", "==", providerName)
  );
  const snapshot = await getCountFromServer(waybillQuery);
  return snapshot.data().count;
}
