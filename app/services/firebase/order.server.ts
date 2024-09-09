import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { dateToDayStr, dayStrToDate } from "~/utils/date";
import { firestore } from "./firebaseInit.server";
import { OrderItem } from "~/components/order";
import { PartnerProfile } from "~/components/partner_profile";
import { addLog, getAllPartnerProfiles } from "./firebase.server";
import { sendAligoMessage } from "../aligo.server";

/**
 * 오늘 주문서가 공유되었는지를 불러옵니다.
 * @param
 * @returns
 *  정산 기록이 있을 경우 오늘 날짜의 string, 없을 경우 null
 */
export async function isTodayOrderShared() {
  const today = dateToDayStr(new Date());
  const docRef = doc(firestore, "orders", today);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return today;
  } else {
    return null;
  }
}

/**
 * 주문서 내역을 추가합니다.
 * @param orders: OrderItem[], dayStr: string (XXXX-XX-XX)
 * @returns
 *
 */
export async function addOrders({
  orders,
  dayStr,
}: {
  orders: OrderItem[];
  dayStr: string;
}) {
  try {
    let partnerMap: Map<string, PartnerProfile> = await getAllPartnerProfiles();
    const phoneList: string[] = [];
    const phoneOrderCount: Map<string, number> = new Map();
    let orderBatch = writeBatch(firestore);
    const time = new Date().getTime();

    for (let i = 0; i < orders.length; i++) {
      const item = orders[i];

      //연락 돌릴 연락처 && 건수 추가
      const partner = partnerMap.get(item.partnerName);
      if (partner == undefined) {
        throw Error("오류: 존재하지 않는 파트너입니다.");
      }

      const phone = partner.phone;
      if (phone.length > 0 && !phoneList.includes(phone)) {
        phoneList.push(phone);
        const orderCount = phoneOrderCount.get(phone);
        if (orderCount == undefined) {
          phoneOrderCount.set(phone, 1);
        } else {
          phoneOrderCount.set(phone, orderCount + 1);
        }
      }

      const itemDocName = `${time}_${i}`;
      let itemDocRef = doc(firestore, `orders/${dayStr}/items`, itemDocName);
      orderBatch.set(itemDocRef, { ...item, orderSharedDate: dayStr });

      //지연주문건에, 주문건 등록 날짜 (Timestamp) 추가해 해당 아이템 추가
      // (id를 똑같이 쓰므로 함께 삭제하거나 운송장 기입할 때 같은 id 삭제하면 됨)
      const date = dayStrToDate(dayStr);
      const timestamp = Timestamp.fromDate(date);
      const delayedOrderItem = {
        ...item,
        orderSharedDate: dayStr,
        orderTimestamp: timestamp,
      };
      let delayedOrderItemDocRef = doc(
        firestore,
        `delayed-orders`,
        itemDocName
      );
      orderBatch.set(delayedOrderItemDocRef, delayedOrderItem);

      if ((i % 200 == 1 && i > 1) || i == orders.length - 1) {
        await orderBatch.commit();
        if (i < orders.length) {
          orderBatch = writeBatch(firestore);
        }
      }
    }

    await setDoc(doc(firestore, `orders/${dayStr}`), {
      isShared: true,
    });

    for (let i = 0; i < phoneList.length; i++) {
      const phone = phoneList[i];
      const orderCount = phoneOrderCount.get(phone);
      if (orderCount == undefined) {
        throw Error("오류: 알리고 발신 과정에서 문제가 발생했습니다.");
      }
      const response = await sendAligoMessage({
        text: `[로파파트너] ${dayStr} 주문이 ${orderCount}건 전달되었습니다. 확인 부탁드립니다.`,
        receiver: phone,
      });
      if (response.result_code != 1) {
        throw Error(`ALIGO 오류: ${response.message}`);
      }
    }

    addLog("addOrders", { dayStr: dayStr, orders: orders.toString() });

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
 * 해당 날짜의 모든 주문서 정보를 불러옵니다
 * @param dayStr: 날짜 (XXXX-XX-XX)
 * @returns
 *  Array of OrderItem
 */
export async function getAllOrders(dayStr: string) {
  const ordersRef = collection(firestore, `orders/${dayStr}/items`);
  const ordersQuery = query(ordersRef, orderBy("managementNumber"));
  const querySnap = await getDocs(ordersQuery);
  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 해당 날짜의, 지정된 파트너의 주문서 정보를 불러옵니다
 * @param dayStr: 날짜 (XXXX-XX-XX), partnerName: 파트너 이름
 * @returns
 *  Array of OrderItem
 */
export async function getPartnerOrders({
  dayStr,
  partnerName,
}: {
  dayStr: string;
  partnerName: string;
}) {
  const ordersRef = collection(firestore, `orders/${dayStr}/items`);

  const ordersQuery = query(
    ordersRef,
    where("partnerName", "==", partnerName),
    orderBy("managementNumber")
  );
  const querySnap = await getDocs(ordersQuery);

  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 해당 주문서 내역들을 삭제합니다
 * 지연주문건과, 완료운송장도 함께 삭제합니다.
 * @param dayStr: 날짜 (XXXX-XX-XX), orders: 삭제할 주문서 목록
 */
export async function deleteOrders({
  dayStr,
  orders,
}: {
  orders: OrderItem[];
  dayStr: string;
}) {
  if (orders.length == 0) {
    return "오류: 입력된 주문이 없습니다.";
  }

  try {
    let deleteBatch = writeBatch(firestore);

    for (let i = 0; i < orders.length; i++) {
      const item = orders[i];

      //order items에 해당 정산아이템 삭제
      const ordersRef = collection(firestore, `orders/${dayStr}/items`);

      const idQuery = query(
        ordersRef,
        where("amount", "==", item.amount),
        where("customsCode", "==", item.customsCode),
        where("deliveryRequest", "==", item.deliveryRequest),
        where("managementNumber", "==", item.managementNumber),
        where("optionName", "==", item.optionName),
        where("orderNumber", "==", item.orderNumber),
        where("orderer", "==", item.orderer),
        where("ordererPhone", "==", item.ordererPhone),
        where("partnerName", "==", item.partnerName),
        where("phone", "==", item.phone),
        where("productName", "==", item.productName),
        where("receiver", "==", item.receiver),
        where("seller", "==", item.seller),
        where("shippingCompany", "==", item.shippingCompany),
        where("waybillNumber", "==", item.waybillNumber),
        where("zipCode", "==", item.zipCode),
        limit(1)
      );
      const querySnap = await getDocs(idQuery);
      querySnap.forEach(async (document) => {
        const docName = document.id;
        deleteBatch.delete(document.ref);

        //지연주문건에서도 삭제
        let delayedOrderItemDocRef = doc(firestore, `delayed-orders`, docName);
        deleteBatch.delete(delayedOrderItemDocRef);

        //완료운송장도 있으면 삭제
        const waybillSharedDate = document.data().waybillSharedDate;

        if (waybillSharedDate.length > 0) {
          let waybillItemDocRef = doc(
            firestore,
            `waybills/${waybillSharedDate}/items`,
            docName
          );
          deleteBatch.delete(waybillItemDocRef);
        }
      });
      if ((i % 130 == 1 && i > 1) || i == orders.length - 1) {
        await deleteBatch.commit();
        if (i < orders.length - 1) {
          deleteBatch = writeBatch(firestore);
        }
      }
    }
    addLog("deleteOrders", { dayStr: dayStr, orders: orders.toString() });
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
 * 오늘 공유한 주문 건수를 불러옵니다.
 * @returns
 */
export async function getTodayOrdersCount() {
  const today = dateToDayStr(new Date());
  const ordersRef = collection(firestore, `orders/${today}/items`);
  const snapshot = await getCountFromServer(ordersRef);
  return snapshot.data().count;
}

/**
 * 해당 파트너가 오늘 공유받은 주문 건수를 불러옵니다.
 * @param partnerName: 파트너명
 * @returns
 */
export async function getPartnerTodayOrdersCount(partnerName: string) {
  const today = dateToDayStr(new Date());
  const ordersRef = collection(firestore, `orders/${today}/items`);
  const orderQuery = query(ordersRef, where("partnerName", "==", partnerName));
  const snapshot = await getCountFromServer(orderQuery);
  return snapshot.data().count;
}
