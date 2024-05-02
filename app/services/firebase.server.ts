// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { PartnerProfile } from "~/components/partner_profile";
import {
  dateToDayStr,
  dayStrToDate,
  getIdFromTime,
  getTimezoneDate,
} from "~/components/date";
import { OrderItem } from "~/components/order";
import {
  createAuthAccount,
  deleteAuthAccount,
  updateAuthAccount,
} from "./firebaseAdmin.server";
import { emailToId } from "~/utils/account";
import { sendAligoMessage } from "./aligo.server";
import { NoticeItem } from "~/components/notice";
import { ProductWithoutFile } from "~/components/product";
import { SettlementSumItem } from "~/components/settlement_sum";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let firebaseApp: any;
let firestore: any;
let storage: any;

if (!firebaseApp?.apps.length || !firestore.apps.length) {
  firebaseApp = initializeApp(firebaseConfig);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
}

/**
 * Firebase를 위한 설정입니다. Client side에서 로그인하기 위해 사용합니다.
 * @returns firebaseConfig
 */
export function getFirebaseConfig() {
  return firebaseConfig;
}

/**
 * 해당 ID의 계정이 어드민인지 확인합니다.
 * @param email: 이메일
 * @returns true: 어드민, false: 일반 파트너 (또는 존재하지 않는 계정)
 */
export async function isAdmin(email: string) {
  const id = emailToId(email);
  const accountsRef = collection(firestore, "accounts");
  const idQuery = query(accountsRef, where("id", "==", id), limit(1));
  const querySnap = await getDocs(idQuery);
  if (!querySnap.empty) {
    let result = false;
    querySnap.forEach((doc) => {
      if (doc.data().isAdmin) {
        result = true;
      }
    });
    return result;
  } else {
    return false;
  }
}

/**
 * 파트너의 정보들을 불러옵니다
 * @param param0
 * @returns
 *  Map(key: (partner name), value: PartnerProfile)
 */
export async function getPartnerProfiles() {
  const accountsRef = collection(firestore, "accounts");
  const partnerQuery = query(accountsRef, where("isAdmin", "==", false));
  const querySnap = await getDocs(partnerQuery);
  const map = new Map<string, any>();
  querySnap.docs.forEach((doc) => {
    map.set(doc.id, doc.data());
  });
  return map;
}

/**
 * 해당 이름의 파트너의 정보들을 불러옵니다
 * @param param0
 * @returns
 *
 */
export async function getPartnerProfile({ name }: { name: string }) {
  const docRef = doc(firestore, "accounts", name);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

/**
 * 파트너 정보를 추가하거나 수정합니다.
 * @param partnerProfie: PartnerProfile
 * @returns
 * 에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function addPartnerProfile({
  partnerProfile,
}: {
  partnerProfile: PartnerProfile;
}) {
  const docRef = doc(firestore, "accounts", partnerProfile.name);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const result = await updateAuthAccount(
      docSnap.id,
      partnerProfile.id,
      partnerProfile.password
    );
    if (typeof result == "string") {
      return result;
    }
  } else {
    const result = await createAuthAccount(
      partnerProfile.id,
      partnerProfile.password,
      partnerProfile.name
    );
    if (typeof result == "string") {
      return result;
    }
  }

  const result = await setDoc(doc(firestore, "accounts", partnerProfile.name), {
    name: partnerProfile.name,
    id: partnerProfile.id,
    password: partnerProfile.password,
    email: partnerProfile.email,
    phone: partnerProfile.phone,
    lofaFee: partnerProfile.lofaFee,
    otherFee: partnerProfile.otherFee,
    shippingFee: partnerProfile.shippingFee,
    brn: partnerProfile.brn,
    bankAccount: partnerProfile.bankAccount,
    isAdmin: false,
  }).catch((error) => {
    return error.message;
  });

  return result;
}

/**
 * 여러 파트너를 한 번에 추가합니다.
 * @param partnerProfiles: PartnerProfile[]
 * @returns
 *
 */
export async function addPartnerProfiles({
  partnerProfiles,
}: {
  partnerProfiles: PartnerProfile[];
}) {
  const batch = writeBatch(firestore);
  partnerProfiles.forEach(async (item, index) => {
    const docName = item.name;
    let docRef = doc(firestore, "accounts", docName);
    batch.set(docRef, {
      name: item.name,
      id: item.id,
      password: item.password,
      email: item.email,
      phone: item.phone,
      lofaFee: item.lofaFee,
      otherFee: item.otherFee,
      shippingFee: item.shippingFee,
      isAdmin: false,
    });

    await createAuthAccount(item.id, item.password, item.name);
  });
  await batch.commit();
}

/**
 * 파트너 정보를 삭제합니다.
 * @param id: string (해당 파트너 아이디)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function deletePartnerProfile({ name }: { name: string }) {
  const authResult = await deleteAuthAccount(name);
  if (typeof authResult == "string") {
    console.log(authResult);
    return authResult;
  }
  const firestoreResult = await deleteDoc(
    doc(firestore, "accounts", name)
  ).catch((error) => {
    return error.message;
  });
  return firestoreResult;
}

/**
 * 정산내역을 추가합니다.
 * 추가 후 정산합계 기록도 수정합니다.
 * @param settlements: JSON string of settlement items list
 * @returns
 *
 */
export async function addSettlements({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `settlements-data-add/${monthStr}`), {
      json: settlements,
      updateTime: time,
    });

    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 해당 정산내역들을 삭제합니다
 * @param monthStr: 월,
 * @param settlements: 대상 정산내역, JSON string of SettlementItem array
 */

export async function deleteSettlements({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `settlements-data-delete/${monthStr}`), {
      json: settlements,
      updateTime: time,
    });

    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 해당 정산내역들의 배송비를 0원으로 만듭니다.
 * @param monthStr: 월
 * @param settlements: 대상 정산내역, JSON string of SettlementItem array
 */

export async function deleteSettlementsShippingFee({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    await setDoc(
      doc(firestore, `settlements-data-delete-shipping-fee/${monthStr}`),
      {
        json: settlements,
        updateTime: time,
      }
    );

    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 정산을 등록한 월의 목록을 불러옵니다.
 * @param
 * @returns
 *  정산 기록이 있는 월들의 리스트 (XX년 XX월)
 */
export async function getSettlementMonthes() {
  const settlementsSnap = await getDocs(collection(firestore, "settlements"));
  return settlementsSnap.docs.map((doc) => doc.id);
}

/**
 * 정산 데이터를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  Array of SettlementItem
 */
export async function getSettlements({
  partnerName,
  monthStr,
}: {
  partnerName: string;
  monthStr: string;
}) {
  const settlementsRef = collection(firestore, `settlements/${monthStr}/items`);
  const settlementsQuery = query(
    settlementsRef,
    where("partnerName", "==", partnerName)
  );
  const querySnap = await getDocs(settlementsQuery);
  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 정산 합계 정보를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  해당 월 파트너의 판매처별 정산 금액 합 (settlement_{판매처이름}, shipping_{판매처이름})
 *  없을 경우 null
 */
export async function getSettlementSum({
  partnerName,
  monthStr,
}: {
  partnerName: string;
  monthStr: string;
}) {
  const docRef = doc(
    firestore,
    `settlements/${monthStr}/partners`,
    partnerName
  );
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

/**
 * 모든 파트너의 정산 합계 정보를 불러옵니다
 * @param monthStr: 월
 * @returns
 *  해당 월 모든 파트너의 판매처별 정산 금액 합 ([partnerName, data: {settlement_{판매처이름}, shipping_{판매처이름...}])
 */
export async function getAllSettlementSum({ monthStr }: { monthStr: string }) {
  const settlementsRef = collection(
    firestore,
    `settlements/${monthStr}/partners`
  );
  const querySnap = await getDocs(settlementsRef);
  const result: SettlementSumItem[] = [];
  for (let i = 0; i < querySnap.docs.length; i++) {
    const doc = querySnap.docs[i];
    const partnerProfile = await getPartnerProfile({ name: doc.id });
    let brn = "";
    let bankAccount = "";
    if (partnerProfile !== null) {
      brn = partnerProfile.brn;
      bankAccount = partnerProfile.bankAccount;
    }
    result.push({
      partnerName: doc.id,
      data: doc.data(),
      brn: brn,
      bankAccount: bankAccount,
    });
  }
  return result;
}

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
    let partnerMap: Map<string, PartnerProfile> = await getPartnerProfiles();
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

    let day = new Date();
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
        where("orderer", "==", item.orderer),
        where("ordererPhone", "==", item.ordererPhone),
        where("partnerName", "==", item.partnerName),
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

  const ordersQuery = query(
    ordersRef,
    where("partnerName", "==", partnerName),
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
        where("orderer", "==", item.orderer),
        where("ordererPhone", "==", item.ordererPhone),
        where("partnerName", "==", item.partnerName),
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

  const ordersQuery = query(
    ordersRef,
    where("partnerName", "==", partnerName),
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

    let nextDay = new Date();
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
        where("orderer", "==", item.orderer),
        where("ordererPhone", "==", item.ordererPhone),
        where("partnerName", "==", item.partnerName),
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
export async function getPartnerTodayWaybillsCount(partnerName: string) {
  const today = dateToDayStr(new Date());
  const waybillsRef = collection(firestore, `waybills/${today}/items`);
  const waybillQuery = query(
    waybillsRef,
    where("partnerName", "==", partnerName)
  );
  const snapshot = await getCountFromServer(waybillQuery);
  return snapshot.data().count;
}

/**
 * 지연일자가 일정일 이상인 주문건의 개수를 불러옵니다.
 * @params day: 기준 지연일자
 * @returns
 */
export async function getDelayedOrdersCount(day: number) {
  const date = new Date();
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
  partnerName: string
) {
  const date = new Date();
  date.setDate(date.getDate() - day);
  const timestamp = Timestamp.fromDate(date);

  const delayedRef = collection(firestore, "delayed-orders");
  const delayQuery = query(
    delayedRef,
    where("orderTimestamp", "<=", timestamp),
    where("partnerName", "==", partnerName)
  );
  const snapshot = await getCountFromServer(delayQuery);
  return snapshot.data().count;
}

/**
 * 알림을 추가합니다
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function addNotice({
  partnerName,
  topic,
  detail,
  monthStr,
}: {
  partnerName: string;
  topic: string;
  detail: string;
  monthStr: string;
}) {
  try {
    const docName = `${new Date().getTime()}`;
    await setDoc(doc(firestore, `notices/${monthStr}/items/${docName}`), {
      partnerName: partnerName,
      topic: topic,
      detail: detail,
      isShared: false,
    });

    await setDoc(doc(firestore, `notices/${monthStr}`), { isShared: "true" });
    return true;
  } catch (error: any) {
    return error.message ?? error;
  }
}

/**
 * 알림을 수정합니다.
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function editNotice({
  partnerName,
  topic,
  detail,
  monthStr,
  id,
}: {
  partnerName: string;
  topic: string;
  detail: string;
  monthStr: string;
  id: string;
}) {
  try {
    await setDoc(doc(firestore, `notices/${monthStr}/items/${id}`), {
      partnerName: partnerName,
      topic: topic,
      detail: detail,
      isShared: false,
    });
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
 * 알림을 공유합니다..
 * @param month: 월, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function shareNotice({
  monthStr,
  id,
  partnerName,
  topic,
}: {
  monthStr: string;
  id: string;
  partnerName: string;
  topic: string;
}) {
  try {
    const timestamp = Timestamp.fromDate(new Date());
    await updateDoc(doc(firestore, `notices/${monthStr}/items/${id}`), {
      isShared: true,
      sharedDate: timestamp,
    });

    const profile = await getPartnerProfile({ name: partnerName });
    const phone = profile?.phone ?? "";
    if (phone.length > 0) {
      const response = await sendAligoMessage({
        text: `[로파파트너] [${topic}]에 대하여 긴급알림이 있습니다. 파트너사이트의 '발신함 / 수신함'을 확인 부탁드립니다.`,
        receiver: phone,
      });
      if (response.result_code != 1) {
        throw Error(`ALIGO 오류: ${response.message}`);
      }
    }

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
 * 알림들을 불러옵니다
 * @param month: 월, partnerName: 파트너명 (비어있을 경우 모든 파트너)
 * @returns
 *  List of NoticeItem
 */
export async function getNotices({
  monthStr: month,
  partnerName,
}: {
  monthStr: string;
  partnerName: string;
}) {
  const noticesRef = collection(firestore, `notices/${month}/items`);
  let querySnap;
  if (partnerName.length > 0) {
    const noticeQuery = query(
      noticesRef,
      where("partnerName", "==", partnerName)
    );
    querySnap = await getDocs(noticeQuery);
  } else {
    querySnap = await getDocs(noticesRef);
  }

  const list: NoticeItem[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    const timestamp: Timestamp | undefined = data.sharedDate;
    let sharedDate;
    if (timestamp != undefined) {
      sharedDate = dateToDayStr(timestamp.toDate());
    }
    list.push({
      partnerName: data.partnerName,
      docId: doc.id,
      sharedDate: sharedDate,
      topic: data.topic,
      detail: data.detail,
      replies: data.replies ?? [],
    });
  });
  return list;
}

/**
 * 공유된 알림들에 한하여 불러옵니다 (파트너 전용)
 * @param month: 월, partnerName: 파트너명
 * @returns
 *  List of NoticeItem
 */
export async function getSharedNotices({
  monthStr: month,
  partnerName,
}: {
  monthStr: string;
  partnerName: string;
}) {
  const noticesRef = collection(firestore, `notices/${month}/items`);
  let querySnap;
  const noticeQuery = query(
    noticesRef,
    where("partnerName", "==", partnerName),
    where("isShared", "==", true)
  );
  querySnap = await getDocs(noticeQuery);

  const list: NoticeItem[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    const timestamp: Timestamp | undefined = data.sharedDate;
    let sharedDate;
    if (timestamp != undefined) {
      sharedDate = dateToDayStr(timestamp.toDate());
    }
    list.push({
      partnerName: data.partnerName,
      docId: doc.id,
      sharedDate: sharedDate,
      topic: data.topic,
      detail: data.detail,
      replies: data.replies ?? [],
    });
  });
  return list;
}

/**
 * 알림을 삭제합니다.
 * @param month: 월, id: 삭제할 알림 문서 아이디
 * @returns
 */
export async function deleteNotice({
  monthStr,
  id,
}: {
  monthStr: string;
  id: string;
}) {
  try {
    await deleteDoc(doc(firestore, `notices/${monthStr}/items/${id}`)).catch(
      (error) => {
        return error.message;
      }
    );
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
 * 알림에 대해 답신합니다.
 * @param month: 월, id: 해당 doc id, reply: 답신
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function replyNotice({
  monthStr,
  id,
  reply,
}: {
  monthStr: string;
  id: string;
  reply: string;
}) {
  try {
    const time = getTimezoneDate(new Date());
    const timeStr = `${dateToDayStr(
      new Date()
    )} ${time.getHours()}:${time.getMinutes()}`;
    const replyStr = `[${timeStr}] ${reply}`;
    await updateDoc(doc(firestore, `notices/${monthStr}/items/${id}`), {
      replies: arrayUnion(replyStr),
    });

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
 * 상품 등록 정보를 추가합니다.
 * @param product: Product
 * @returns
 * 에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function addProductWithoutFile({
  product,
}: {
  product: ProductWithoutFile;
}) {
  const docRef = doc(firestore, "products", product.productName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return "이미 해당 이름의 상품이 등록되어 있습니다.";
  }

  const id = getIdFromTime();

  setDoc(doc(firestore, "products", product.productName), {
    id: id,
    partnerName: product.partnerName,
    productName: product.productName,
    englishProductName: product.englishProductName,
    explanation: product.explanation,
    keyword: product.keyword,
    sellerPrice: product.sellerPrice,
    isUsingOption: product.isUsingOption,
    option: product.option,
    refundExplanation: product.refundExplanation,
    serviceExplanation: product.serviceExplanation,
    status: product.status,
    memo: product.memo,
    detailImageNameList: [],
    detailImageURLList: [],
    extraImageNameList: [],
    extraImageURLList: [],
    mainImageName: "",
    mainImageURL: "",
    thumbnailImageName: "",
    thumbnailImageURL: "",
  });

  return null;
}

/**
 * 지정된 파트너가 등록한 상품 정보를 불러옵니다
 * @param partnerName: 파트너 이름
 * @returns
 *  Array of LoadedProduct
 */
export async function getPartnerProducts({
  partnerName,
}: {
  partnerName: string;
}) {
  try {
    const productsRef = collection(firestore, `products`);

    const productsQuery = query(
      productsRef,
      where("partnerName", "==", partnerName)
    );
    const querySnap = await getDocs(productsQuery);

    return querySnap.docs.map((doc) => doc.data());
  } catch (error: any) {
    return error.message ?? error.toString();
  }
}

/**
 * 모든 상품 정보를 불러옵니다
 * 임시저장은 제외
 * @param partnerName: 파트너 이름
 * @returns
 *  Array of LoadedProduct
 */
export async function getAllProducts() {
  try {
    const productsRef = collection(firestore, `products`);

    const productsQuery = query(productsRef, where("status", "!=", "임시저장"));
    const querySnap = await getDocs(productsQuery);

    return querySnap.docs.map((doc) => doc.data());
  } catch (error: any) {
    return error.message ?? error.toString();
  }
}

/**
 * 등록한 상품 정보를 삭제합니다.
 * @param id: productName (해당 상품 이름)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function deleteProduct({ productName }: { productName: string }) {
  try {
    const docRef = doc(firestore, "products", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      await deleteDoc(doc(firestore, "products", productName));

      const mainPath = `${data.productName}/main/${data.mainImageName}`;
      try {
        await deleteObject(ref(storage, mainPath));
      } catch (error: any) {
        console.log("mainPath file not found");
      }

      const thumbnailPath = `${data.productName}/thumbnail/${data.thumbnailImageName}`;
      try {
        await deleteObject(ref(storage, thumbnailPath));
      } catch (error: any) {
        console.log("thumbnailPath file not found");
      }
      const detailNameList = data.detailImageNameList;
      for (let i = 0; i < detailNameList.length; i++) {
        const detailPath = `${data.productName}/detail/${detailNameList[i]}`;
        try {
          await deleteObject(ref(storage, detailPath));
        } catch (error: any) {
          console.log("detailPath file not found");
        }
      }
      const extraNameList = data.extraImageNameList;
      for (let i = 0; i < extraNameList.length; i++) {
        const extraPath = `${data.productName}/extra/${extraNameList[i]}`;
        try {
          await deleteObject(ref(storage, extraPath));
        } catch (error: any) {
          console.log("extraPath file not found");
        }
      }
    }
  } catch (error: any) {
    return error.message ?? error;
  }

  return null;
}

/**
 * 등록한 상품 정보를 삭제합니다.
 * @param id: productName (해당 상품 이름)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function deleteProducts({
  productNameList,
}: {
  productNameList: string[];
}) {
  try {
    for (let i = 0; i < productNameList.length; i++) {
      const docRef = doc(firestore, "products", productNameList[i]);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        deleteDoc(doc(firestore, "products", productNameList[i]));

        const mainPath = `${data.productName}/main/${data.mainImageName}`;
        deleteObject(ref(storage, mainPath));
        const thumbnailPath = `${data.productName}/thumbnail/${data.thumbnailImageName}`;
        deleteObject(ref(storage, thumbnailPath));
        const detailNameList = data.detailImageNameList;
        for (let i = 0; i < detailNameList.length; i++) {
          const detailPath = `${data.productName}/detail/${detailNameList[i]}`;
          deleteObject(ref(storage, detailPath));
        }
        const extraNameList = data.extraImageNameList;
        for (let i = 0; i < extraNameList.length; i++) {
          const extraPath = `${data.productName}/extra/${extraNameList[i]}`;
          deleteObject(ref(storage, extraPath));
        }
      }
    }
  } catch (error: any) {
    return error.message ?? error;
  }

  return null;
}

/**
 * 등록한 상품 정보를 승인합니다.
 * @param id: productName (해당 상품 이름)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function acceptProducts({
  productNameList,
}: {
  productNameList: string[];
}) {
  try {
    for (let i = 0; i < productNameList.length; i++) {
      const docRef = doc(firestore, "products", productNameList[i]);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        updateDoc(doc(firestore, "products", productNameList[i]), {
          status: "승인완료",
        });
      }
    }
  } catch (error: any) {
    return error.message ?? error;
  }

  return null;
}

/**
 * 등록한 상품 정보를 거부합니다.
 * @param id: productName (해당 상품 이름)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function declineProducts({
  productNameList,
}: {
  productNameList: string[];
}) {
  try {
    for (let i = 0; i < productNameList.length; i++) {
      const docRef = doc(firestore, "products", productNameList[i]);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        updateDoc(doc(firestore, "products", productNameList[i]), {
          status: "승인거부",
        });
      }
    }
  } catch (error: any) {
    return error.message ?? error;
  }

  return null;
}

/**
 * 상품이 DB에 등록되었는지를 확인합니다.
 * 업로드 진행 상태 데이터도 함께 지웁니다.
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

export async function isProductUploaded({
  productName,
}: {
  productName: string;
}) {
  try {
    const docRef = doc(firestore, "products", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(doc(firestore, "products-progress", productName));
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    return false;
  }
}

/**
 * 이미지 업로드 진행 상태를 받아옵니다.
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

export async function getProductUploadProgress({
  productName,
}: {
  productName: string;
}) {
  try {
    const docRef = doc(firestore, "products-progress", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let total: number = data.mainTotalBytes + data.thumbnailTotalBytes;
      let transferred: number =
        data.mainBytesTransferred + data.thumbnailBytesTransferred;
      for (let i = 0; i < data.detailLength; i++) {
        total += data[`detailTotalBytes_${i}`];
        transferred += data[`detailBytesTransferred_${i}`];
      }
      for (let i = 0; i < data.extraLength; i++) {
        total += data[`extraTotalBytes_${i}`];
        transferred += data[`extraBytesTransferred_${i}`];
      }
      const progress = (transferred / total) * 100;
      return progress;
    } else {
      return 0;
    }
  } catch (error: any) {
    console.log("ERROR", error);
    return 0;
  }
}

export async function initializeUploadProductImage(
  productName: string,
  mainSize: number,
  mainName: string,
  thumbnailSize: number,
  thumbnailName: string,
  detailSizeList: number[],
  detailNameList: string[],
  extraSizeList: number[],
  extraNameList: string[]
) {
  let data: any = {
    mainTotalBytes: mainSize,
    thumbnailTotalBytes: thumbnailSize,
    mainBytesTransferred: 0,
    thumbnailBytesTransferred: 0,
    mainName: mainName,
    thumbnailName: thumbnailName,
    detailLength: detailSizeList.length,
    extraLength: extraSizeList.length,
  };

  for (let i = 0; i < detailSizeList.length; i++) {
    data[`detailBytesTransferred_${i}`] = 0;
    data[`detailTotalBytes_${i}`] = Number(detailSizeList[i]);
    data[`detailName_${i}`] = detailNameList[i];
  }

  for (let i = 0; i < extraSizeList.length; i++) {
    data[`extraBytesTransferred_${i}`] = 0;
    data[`extraTotalBytes_${i}`] = Number(extraSizeList[i]);
    data[`extraName_${i}`] = extraNameList[i];
  }
  await setDoc(doc(firestore, "products-progress", productName), data);
}

export async function uploadProductImage(
  file: File,
  fileName: string,
  usage: string,
  productName: string,
  detailIndex = 0
) {
  const arrayBuffer = await file.arrayBuffer();
  const imagePath = `${productName}/${usage}/${fileName}`;
  const imageStorageRef = ref(storage, imagePath);
  const uploadTask = uploadBytesResumable(imageStorageRef, arrayBuffer);


  switch (usage) {
    case "main":
      updateDoc(doc(firestore, "products-progress", productName), {
        mainStarted: "true",
      });
      break;
    case "thumbnail":
      updateDoc(doc(firestore, "products-progress", productName), {
        thumbnailStarted: "true",
      });
      break;
    case "detail":
      let detailData: any = {};
      detailData[`detailStarted_${detailIndex}`] =
        "true";
      updateDoc(
        doc(firestore, "products-progress", productName),
        detailData
      );
      break;
    case "extra":
      let extraData: any = {};
      extraData[`extraStarted_${detailIndex}`] =
        "true";
      updateDoc(
        doc(firestore, "products-progress", productName),
        extraData
      );
      break;
  }
  
  let progress = 0;
  let stair = 50000;

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      if (snapshot.bytesTransferred > progress) {
        progress += stair;
        switch (usage) {
          case "main":
            updateDoc(doc(firestore, "products-progress", productName), {
              mainBytesTransferred: snapshot.bytesTransferred,
            });
            break;
          case "thumbnail":
            updateDoc(doc(firestore, "products-progress", productName), {
              thumbnailBytesTransferred: snapshot.bytesTransferred,
            });
            break;
          case "detail":
            let detailData: any = {};
            detailData[`detailBytesTransferred_${detailIndex}`] =
              snapshot.bytesTransferred;
            updateDoc(
              doc(firestore, "products-progress", productName),
              detailData
            );
            break;
          case "extra":
            let extraData: any = {};
            extraData[`extraBytesTransferred_${detailIndex}`] =
              snapshot.bytesTransferred;
            updateDoc(
              doc(firestore, "products-progress", productName),
              extraData
            );
            break;
        }
      }
    },
    async (error) => {
      let errorData: any = {}
      errorData[`${usage}-${detailIndex}-errorData`] = error.message;
      updateDoc(
        doc(firestore, "products-progress", productName),
        errorData
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      uploadProductImage(
        file,
        fileName,
        usage,
        productName,
        detailIndex
      )
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((url) => {
        switch (usage) {
          case "main":
            updateDoc(doc(firestore, "products-progress", productName), {
              mainBytesTransferred: arrayBuffer.byteLength,
              mainURL: url,
            });
            break;
          case "thumbnail":
            updateDoc(doc(firestore, "products-progress", productName), {
              thumbnailBytesTransferred: arrayBuffer.byteLength,
              thumbnailURL: url,
            });
            break;
          case "detail":
            let detailData: any = {};
            detailData[`detailBytesTransferred_${detailIndex}`] =
              arrayBuffer.byteLength;
            detailData[`detailURL_${detailIndex}`] = url;
            updateDoc(
              doc(firestore, "products-progress", productName),
              detailData
            );
            break;
          case "extra":
            let extraData: any = {};
            extraData[`extraBytesTransferred_${detailIndex}`] =
              arrayBuffer.byteLength;
            extraData[`extraURL_${detailIndex}`] = url;
            updateDoc(
              doc(firestore, "products-progress", productName),
              extraData
            );
            break;
        }
      });
    }
  );
}

/**
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

export async function isProductImageUploadFinished({
  productName,
}: {
  productName: string;
}) {
  try {
    const docRef = doc(firestore, "products-progress", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const detailURLList = [];
      const detailNameList = [];
      const extraURLList = [];
      const extraNameList = [];
      if (!data.mainURL) return false;
      if (!data.thumbnailURL) return false;
      for (let i = 0; i < data.detailLength; i++) {
        if (!data[`detailURL_${i}`]) return false;
        detailURLList.push(data[`detailURL_${i}`]);
        detailNameList.push(data[`detailName_${i}`]);
      }
      for (let i = 0; i < data.extraLength; i++) {
        if (!data[`extraURL_${i}`]) return false;
        extraURLList.push(data[`extraURL_${i}`]);
        extraNameList.push(data[`extraName_${i}`]);
      }

      await updateDoc(doc(firestore, "products", productName), {
        mainImageURL: data.mainURL,
        mainImageName: data.mainName,
        thumbnailImageURL: data.thumbnailURL,
        thumbnailImageName: data.thumbnailName,
        detailImageURLList: detailURLList,
        detailImageNameList: detailNameList,
        extraImageURLList: extraURLList,
        extraImageNameList: extraNameList,
      });

      await deleteDoc(doc(firestore, "products-progress", productName));

      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    return false;
  }
}

export async function fixProduct() {
  const productsRef = collection(firestore, `products`);
  const querySnapshot = await getDocs(productsRef);
  querySnapshot.forEach((item) => {
    const docId = item.id;
    const data = item.data();
    if (!data.mainImageURL) {
      updateDoc(doc(firestore, `products/${docId}`), {
        detailImageNameList: [],
        detailImageURLList: [],
        extraImageNameList: [],
        extraImageURLList: [],
        mainImageName: "",
        mainImageURL: "",
        thumbnailImageName: "",
        thumbnailImageURL: "",
      });
    }
  });
}
