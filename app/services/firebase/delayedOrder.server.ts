import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { addLog, getPartnerProfile } from "./firebase.server";
import { sendAligoMessage } from "../aligo.server";
import { firestore } from "./firebaseInit.server";
import { dateToDayStr, getTimezoneDate } from "~/utils/date";
import { OrderItem } from "~/components/order";

/**
 * 모든 지연주문건을 불러옵니다
 * @param
 * @returns
 *  Array of OrderItem
 */
export async function getAllDelayedOrders() {
  const ordersRef = collection(firestore, `delayed-orders`);
  const ordersQuery = query(ordersRef, orderBy("orderTimestamp"));
  const querySnap = await getDocs(ordersQuery);
  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 해당 파트너의 지연주문건을 불러옵니다.
 * @param partnerName: 파트너 이름
 * @returns
 *  Array of OrderItem
 */
export async function getPartnerDelayedOrders(partnerName: string) {
  const ordersRef = collection(firestore, `delayed-orders`);

  const partnerProfile = await getPartnerProfile({ name: partnerName });
  if (!partnerProfile) {
    return [];
  }

  const providerName = partnerProfile.providerName;

  const ordersQuery = query(
    ordersRef,
    where("providerName", "==", providerName),
    orderBy("orderTimestamp")
  );
  const querySnap = await getDocs(ordersQuery);

  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 지연주문건의 운송장을 입력합니다
 * @param orders: 입력한 운송장
 * 1. 지연주문건에서 해당 운송장이 삭제되고,
 * 2. 원 주문건의 운송장 내역 수정되며,
 * 2. 완료운송장이 입력됩니다.
 */
export async function shareDelayedWaybills({
  waybills,
}: {
  waybills: OrderItem[];
}) {
  if (waybills.length == 0) {
    return "오류: 입력된 운송장이 없습니다.";
  }

  try {
    let waybillBatch = writeBatch(firestore);

    let nextDay = getTimezoneDate(new Date());
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = dateToDayStr(nextDay);

    for (let i = 0; i < waybills.length; i++) {
      const item = waybills[i];

      const waybillsRef = collection(firestore, `delayed-orders`);

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

        //지연주문건에서 삭제
        waybillBatch.delete(document.ref);

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
    addLog("shareDelayedWaybills", { waybills: waybills.toString() });
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
 * 지연일자가 일정일 이상인 주문건의 개수를 불러옵니다.
 * @params day: 기준 지연일자
 * @returns
 */
export async function getDelayedOrdersCount(day: number) {
  const date = getTimezoneDate(new Date());
  date.setDate(date.getDate() - day);
  const timestamp = Timestamp.fromDate(date);

  const delayedRef = collection(firestore, "delayed-orders");
  const delayQuery = query(
    delayedRef,
    where("orderTimestamp", "<=", timestamp)
  );
  const snapshot = await getCountFromServer(delayQuery);
  return snapshot.data().count;
}

/**
 * 지연일자가 일정일 이상인 주문건의 개수를 불러옵니다.
 * @params day: 기준 지연일자, partnerName: 파트너명
 * @returns
 */
export async function getPartnerDelayedOrdersCount(
  day: number,
  providerName: string
) {
  const date = getTimezoneDate(new Date());
  date.setDate(date.getDate() - day);
  const timestamp = Timestamp.fromDate(date);

  const delayedRef = collection(firestore, "delayed-orders");
  const delayQuery = query(
    delayedRef,
    where("orderTimestamp", "<=", timestamp),
    where("providerName", "==", providerName)
  );
  const snapshot = await getCountFromServer(delayQuery);
  return snapshot.data().count;
}
