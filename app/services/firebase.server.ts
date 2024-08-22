// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  and,
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
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { PartnerProfile } from "~/components/partner_profile";
import { dateToDayStr, dayStrToDate, getTimezoneDate } from "~/utils/date";
import { OrderItem } from "~/components/order";
import {
  createAuthAccount,
  deleteAuthAccount,
  updateAuthAccount,
} from "./firebaseAdmin.server";
import { emailToId } from "~/utils/account";
import { sendAligoMessage } from "./aligo.server";
import { NoticeItem } from "~/components/notice";
import { Product } from "~/components/product";
import { SettlementSumItem } from "~/components/settlement_sum";
import { sendResendEmail } from "./resend.server";
import {
  PossibleCS,
  PossibleOrderStatus,
  RevenueData,
} from "~/components/revenue_data";
import { PartnerRevenueStat } from "~/components/revenue_stat";
import { LofaSellers } from "~/components/seller";
import { DiscountData } from "~/components/discount";

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
 * 판매자의 정보들을 불러옵니다
 * @param param0
 * @returns
 *  Map(key: (partner name), value: SellerProfile)
 */
export async function getAllSellerProfiles() {
  const accountsRef = collection(firestore, "seller");
  const querySnap = await getDocs(accountsRef);
  const map = new Map<string, any>();
  querySnap.docs.forEach((doc) => {
    map.set(doc.id, doc.data());
  });
  return map;
}

/**
 * 판매처 정보를  수정합니다.
 * @param name: string
 * @param fee: number
 * @returns
 * 에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function editSellerProfile(name: string, fee: number) {
  const result = await updateDoc(doc(firestore, "seller", name), {
    fee: fee,
  }).catch((error) => {
    return error.message;
  });

  return result;
}
/**
 * 파트너의 정보들을 불러옵니다
 * @param param0
 * @returns
 *  Map(key: (partner name), value: PartnerProfile)
 */
export async function getAllPartnerProfiles() {
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
    businessName: partnerProfile.businessName,
    businessTaxStandard: partnerProfile.businessTaxStandard,
    providerName: partnerProfile.providerName,
    isAdmin: false,
  }).catch((error) => {
    return error.message;
  });

  return result;
}

// /**
//  * 여러 파트너를 한 번에 추가합니다.
//  * @param partnerProfiles: PartnerProfile[]
//  * @returns
//  *
//  */
// export async function addPartnerProfiles({
//   partnerProfiles,
// }: {
//   partnerProfiles: PartnerProfile[];
// }) {
//   const batch = writeBatch(firestore);
//   partnerProfiles.forEach(async (item, index) => {
//     const docName = item.name;
//     let docRef = doc(firestore, "accounts", docName);
//     batch.set(docRef, {
//       name: item.name,
//       id: item.id,
//       password: item.password,
//       email: item.email,
//       phone: item.phone,
//       lofaFee: item.lofaFee,
//       otherFee: item.otherFee,
//       shippingFee: item.shippingFee,
//       isAdmin: false,
//     });

//     await createAuthAccount(item.id, item.password, item.name);
//   });
//   await batch.commit();
// }

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
  return querySnap.docs.map((doc) => {
    const data = doc.data();
    if (data.orderDate) {
      const date = data.orderDate.toDate();
      data.orderDate = date;
    }
    return data;
  });
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
  const profilesMap = await getAllPartnerProfiles();
  for (let i = 0; i < querySnap.docs.length; i++) {
    const doc = querySnap.docs[i];
    const partnerProfile = profilesMap.get(doc.id);
    let brn = "";
    let bankAccount = "";
    let businessName = "";
    let businessTaxStandard = "";
    if (partnerProfile) {
      brn = partnerProfile.brn ?? "";
      bankAccount = partnerProfile.bankAccount ?? "";
      businessName = partnerProfile.businessName ?? "";
      businessTaxStandard = partnerProfile.businessTaxStandard ?? "";
    }
    result.push({
      partnerName: doc.id,
      data: doc.data(),
      brn: brn,
      bankAccount: bankAccount,
      businessName: businessName,
      businessTaxStandard: businessTaxStandard,
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
  isAdmin,
}: {
  monthStr: string;
  id: string;
  reply: string;
  isAdmin: boolean;
}) {
  try {
    const time = getTimezoneDate(new Date());
    const dateStr = dateToDayStr(new Date());
    const timeStr = `${dateStr} ${time.getHours()}:${String(
      time.getMinutes()
    ).padStart(2, "0")}`;
    const replyStr = `${isAdmin ? "(어드민)" : "(파트너)"}[${timeStr}]
    ${reply}`;
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
export async function addProduct({ product }: { product: Product }) {
  const docRef = doc(firestore, "products", product.productName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return "이미 해당 이름의 상품이 등록되어 있습니다.";
  }

  setDoc(doc(firestore, "products", product.productName), product);

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
export async function deleteProduct({
  productName,
  isDeletingStorage = true,
}: {
  productName: string;
  isDeletingStorage?: boolean;
}) {
  try {
    const docRef = doc(firestore, "products", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const id = data.id;
      const usages = ["main", "thumbnail", "detail", "extra"];

      if (isDeletingStorage) {
        try {
          // 폴더 내의 모든 파일과 하위 폴더 목록 가져오기
          usages.forEach(async (usage) => {
            const folderRef = ref(storage, `product-images/${id}/${usage}`);
            const listResult = await listAll(folderRef);

            // 모든 파일 삭제
            const deletePromises = listResult.items.map((itemRef) => {
              return deleteObject(itemRef);
            });

            // 모든 삭제 작업이 완료될 때까지 기다림
            await Promise.all(deletePromises);
            console.log(
              `All files in folder '${id} ${usage}' have been deleted.`
            );
          });
        } catch (error) {
          console.error("Error deleting files in folder:", error);
        }
      }

      await deleteDoc(doc(firestore, "products", productName));
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
        const id = data.id;
        const usages = ["main", "thumbnail", "detail", "extra"];

        try {
          // 폴더 내의 모든 파일과 하위 폴더 목록 가져오기
          usages.forEach(async (usage) => {
            const folderRef = ref(storage, `product-images/${id}/${usage}`);
            const listResult = await listAll(folderRef);

            // 모든 파일 삭제
            const deletePromises = listResult.items.map((itemRef) => {
              return deleteObject(itemRef);
            });

            // 모든 삭제 작업이 완료될 때까지 기다림
            await Promise.all(deletePromises);
            console.log(
              `All files in folder '${id} ${usage}' have been deleted.`
            );
          });
        } catch (error) {
          console.error("Error deleting files in folder:", error);
        }

        await deleteDoc(doc(firestore, "products", data.productName));
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

export async function uploadProductImage(
  file: File,
  usage: string,
  id: string,
  index = 0
) {
  const arrayBuffer = await file.arrayBuffer();
  const imagePath = `product-images/${id}/${usage}/${usage}_${index}.jpg`;
  const imageStorageRef = ref(storage, imagePath);
  const downloadURL = await uploadBytes(imageStorageRef, arrayBuffer)
    .then(async (snapshot) => {
      const url = await getDownloadURL(snapshot.ref);
      return url;
    })
    .catch((error) => {
      console.log("ERROR", error);
      return "error";
    });

  return downloadURL;
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

export async function sendSettlementNoticeEmail({
  partnerList,
}: {
  partnerList: string[];
}) {
  const profilesMap = await getAllPartnerProfiles();
  let countForRateLimit = 0;
  let successCount = 0;
  let start = performance.now();
  for (let i = 0; i < partnerList.length; i++) {
    countForRateLimit++;
    if (countForRateLimit >= 10) {
      countForRateLimit = 0;
      const end = performance.now();
      const spentTime = end - start;
      if (spentTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - spentTime));
        console.log(`At index i, Waited for ${1000 - spentTime} milisecond`);
      } else {
        console.log(`At index i, spent time is ${spentTime}`);
      }
      start = performance.now();
    }
    const partnerName = partnerList[i];
    const partnerProfile = profilesMap.get(partnerName);
    if (partnerProfile) {
      const email = partnerProfile.email;
      if (email && email.length > 0) {
        const html = `<div><div dir="ltr">안녕하세요.<br>로파서울 입니다.<br>전월 정산내역이 있어 안내드립니다.<br><br><span style="background-color:rgb(255,255,255)"><font size="4"><b style="">[정산내역 확인 후 계산서 발급]</b></font></span><div><span style="background-color:rgb(255,255,0)"><b style="">로파서울 파트너 사이트</b><br></span><div dir="ltr"><span style="background-color:rgb(255,255,0)"><b style=""><a href="https://lofaseoul-partner.netlify.app/login" target="_blank" style="" rel="noreferrer noopener">https://lofaseoul-partner.netlify.app/login</a></b><br></span><br><b style="background-color:rgb(255,255,255)">로파서울 파트너사이트의 정산 조회로 들어가셔서<br>전월의 정산금액과 배송비가 합산된 '최종 정산금액'만큼을 세금계산서 또는 현금영수증 발행 부탁드립니다.&nbsp;<br>본 정산 안내메일 발송일의 전월(판매가 이루어진 달)을 선택 해주셔야 합니다.</b></div><div dir="ltr"><b style=""><br></b><b><font color="#ff0000">* 세금계산서(일반과세자) 또는 현금영수증(간이과세자)이 발행되지 않으면 정산이 이루어지지 않으니, 반드시 말일 전까지 발행 부탁드립니다.&nbsp;</font></b><br><div><b style="background-color:rgb(255,255,0)"><br></b></div><div><b style="background-color:rgb(255,255,0)">비사업자 파트너 분들은 아래 링크를 통해 세금신고를 위한 정보를 기입 부탁드립니다.<br><a href="https://azttw5wwaus.typeform.com/to/leso5NDJ" target="_blank" style="" rel="noreferrer noopener">https://azttw5wwaus.typeform.com/to/leso5NDJ</a></b></div><div><b style=""><br><span style="background-color:rgb(255,255,255)">[정산관련 추가안내]</span></b></div><div>전월의 1일 - 말일 동안의 구매건 중<br>'배송 완료&nbsp;+ 구매자 승인'까지 <b>정상처리가 완료된 내역만 포함</b>됩니다.&nbsp;<br>(월말 주문건들은 포함되지 않을 수 있으며, 정상처리되면 다음달 정산내역에 포함됩니다.)<b style="background-color:rgb(255,255,0)"><br></b><br><b>매월 1일에 전월의 정산내역이 공유</b>되며,<br>세금계산서 및 현금영수증 발행이 확인되면 <b>말일에 이체가 진행</b>됩니다.<br>(말일이 공휴일이면 다음 영업일에 진행됩니다.)<br>말일에 지출증빙이 확인되지 않으면, 안내 메일이 전송되고 <b>10/20일 중간정산일에 정산지연건이 처리</b>됩니다.</div><div><br>파트너사이트를 통해 <b>첫 정산이신 파트너</b>분들은<br><b style="background-color:rgb(255,255,0)">손영준 매니저(<a href="mailto:syj@tabacprss.xyz" rel="noreferrer noopener" target="_blank">syj@tabacprss.xyz</a>)</b>에게 파트너 사이트 로그인 정보 및<br>사업자 등록증을 요청 부탁드립니다.<br><br>긴 글 읽어주시고, 정산과정에 협조 해주셔서 감사합니다.<br><br>로파서울 드림</div></div></div></div></div>`;
        const result = await sendResendEmail({
          to: email,
          subject: `[로파서울] ${partnerName} 정산안내 및 증빙 요청`,
          html: html,
        });
        successCount++;
        if (result.error) {
          return {
            status: "error",
            message: result.error.message,
            partnerName: partnerName,
          };
        }
      }
    } else {
      return {
        status: "error",
        message: `partner profile '${partnerName}' not found`,
        partnerName: partnerName,
      };
    }
  }
  return {
    status: "ok",
    message: `파트너 ${successCount}곳에 메일이 전송되었습니다. (메일이 누락된 경우 제외 처리)`,
  };
}

/**
 * 수익통계자료를 업로드합니다.
 * @param settlements: JSON string of settlement items list
 * @returns
 *
 */
export async function addRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `revenue-data-add/data`), {
      json: data,
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
 * 조건을 만족하는 수익통계 데이터를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  Array of RevenueData
 */
export async function getRevenueData({
  startDate,
  endDate,
  partnerName,
  productName,
  seller,
  orderStatus,
  cs,
  filterDiscount,
}: {
  startDate: Date;
  endDate: Date;
  partnerName: string;
  productName: string;
  seller: string;
  orderStatus: string;
  cs: string;
  filterDiscount: string;
}) {
  let orderStatusQueryArray: string[];
  switch (orderStatus) {
    case "전체":
      orderStatusQueryArray = PossibleOrderStatus;
      break;
    case "접수+송장":
      orderStatusQueryArray = ["접수", "송장"];
      break;
    case "접수+배송":
      orderStatusQueryArray = ["접수", "배송"];
      break;
    case "송장+배송":
      orderStatusQueryArray = ["송장", "배송"];
      break;
    default:
      orderStatusQueryArray = [orderStatus];
      break;
  }

  let csQueryArray: string[];

  switch (cs) {
    case "전체":
      csQueryArray = PossibleCS;
      break;
    case "정상":
      csQueryArray = ["정상"];
      break;
    case "정상+교환":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
      ];
      break;
    case "취소(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 취소",
        "배송전 전체 취소",
        "배송후 부분 취소",
        "배송후 전체 취소",
      ];
      break;
    case "교환(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
        "맞교환",
        "배송후교환C",
      ];
      break;
    case "배송전 취소":
      csQueryArray = ["배송전 부분 취소", "배송전 전체 취소"];
      break;
    case "배송후 취소":
      csQueryArray = ["배송후 부분 취소", "배송후 전체 취소"];
      break;
    case "배송전 교환":
      csQueryArray = ["배송전 부분 교환", "배송전 전체 교환"];
      break;
    case "배송후 교환":
      csQueryArray = ["배송후 부분 교환", "배송후 전체 교환", "배송후교환C"];
      break;
    case "보류":
    case "맞교환":
    case "배송후교환C":
      csQueryArray = [cs];
      break;
    case "부분취소":
      csQueryArray = ["배송전 부분 취소", "배송후 부분 취소"];
      break;
    case "부분취소 제외":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 취소",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 취소",
        "배송후 전체 교환",
        "보류",
        "맞교환",
        "배송후교환C",
      ];
      break;
    default:
      csQueryArray = [cs];
      break;
  }

  let filterDiscountQueryArray: boolean[] = [];
  switch (filterDiscount) {
    case "전체":
      filterDiscountQueryArray = [true, false];
      break;
    case "할인 있음":
      filterDiscountQueryArray = [true];
      break;
    case "할인 없음":
      filterDiscountQueryArray = [false];
      break;
  }

  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate)),
    where("orderStatus", "in", orderStatusQueryArray), // Max 3
    //where("cs", "in", csQueryArray), //Max 12, 사용 불가, 불러온 후 직접 필터해서 확인
    where("isDiscounted", "in", filterDiscountQueryArray) //Max 2
  );

  if (partnerName.length > 0) {
    revenueDataQuery = query(
      revenueDataQuery,
      where("partnerName", "==", partnerName)
    );
  }

  if (seller !== "all") {
    revenueDataQuery = query(revenueDataQuery, where("seller", "==", seller));
  }

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult: { data: DocumentData; id: string }[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (
      data.productName.includes(productName) &&
      csQueryArray.includes(data.cs)
    ) {
      data.orderDate = data.orderDate.toDate();
      searchResult.push({ data: data, id: doc.id });
    }
  });
  return searchResult;
}

/**
 * 수익통계자료를 삭제합니다.
 * @param JSON string of {data: RevenueData, id: string}[]
 *
 */
export async function deleteRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `revenue-data-delete/data`), {
      json: data,
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

export async function getRevenueStats({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const sellerProfiles = await getAllSellerProfiles();
  const partnerProfiles = await getAllPartnerProfiles();
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate))
  );

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult = new Map<string, PartnerRevenueStat>();

  querySnap.docs.forEach((doc) => {
    const data = doc.data() as RevenueData;
    const isLofa = LofaSellers.includes(data.seller);
    const isCsOK = data.cs == "정상";
    const partnerProfile: PartnerProfile = partnerProfiles.get(
      data.partnerName
    );
    const commonFeeRate = isLofa
      ? partnerProfile.lofaFee
      : partnerProfile.otherFee; //정상수수료율
    const platformFeeRate =
      sellerProfiles.get(data.seller) != undefined
        ? sellerProfiles.get(data.seller).fee
        : 0;

    if (!searchResult.has(data.partnerName)) {
      let partnerStat: PartnerRevenueStat = {
        startDateStr: dateToDayStr(startDate, false),
        endDateStr: dateToDayStr(endDate, false),
        partnerName: data.partnerName,
        lofaSalesAmount: 0,
        otherSalesAmount: 0,
        totalSalesAmount: 0,
        partnerSettlement: 0,
        platformFee: 0,
        lofaDiscountLevy: 0,
        proceeds: 0,
        netProfitAfterTax: 0,
        returnRate: 0,
        productCategory: [], //TODO: add product category
      };

      searchResult.set(data.partnerName, partnerStat);
    }

    let lofaSalesAmount;
    let otherSalesAmount;
    let totalSalesAmount;
    let partnerSettlement;
    let platformFee;
    let lofaDiscountLevy;
    let proceeds;
    let netProfitAfterTax;

    if (!data.isDiscounted) {
      lofaSalesAmount = isCsOK && isLofa ? data.price * data.amount : 0;
      otherSalesAmount = isCsOK && !isLofa ? data.price * data.amount : 0;
      totalSalesAmount = lofaSalesAmount + otherSalesAmount;
      partnerSettlement = (totalSalesAmount * (100 - commonFeeRate)) / 100;
      const platformSettlement = isLofa
        ? totalSalesAmount
        : (totalSalesAmount * (100 - platformFeeRate)) / 100; //플랫폼정산금
      platformFee = totalSalesAmount - platformSettlement;
      lofaDiscountLevy = 0;
      proceeds = totalSalesAmount - partnerSettlement - platformFee;
      switch (partnerProfile.businessTaxStandard) {
        case "일반":
          netProfitAfterTax = proceeds * 0.9;
          break;
        case "간이":
        case "비사업자":
          netProfitAfterTax = platformSettlement * 0.9 - partnerSettlement;
          break;
        case "면세":
        default:
          netProfitAfterTax = proceeds;
          break;
      }
      if (!isCsOK) {
        netProfitAfterTax = 0;
      }
    } else {
      //TODO
      lofaSalesAmount = 0;
      otherSalesAmount = 0;
      totalSalesAmount = 0;
      partnerSettlement = 0;
      platformFee = 0;
      lofaDiscountLevy = 0;
      proceeds = 0;
      netProfitAfterTax = 0;
    }

    const stat = searchResult.get(data.partnerName) as PartnerRevenueStat;
    stat.lofaSalesAmount += lofaSalesAmount;
    stat.otherSalesAmount += otherSalesAmount;
    stat.totalSalesAmount += totalSalesAmount;
    stat.partnerSettlement += partnerSettlement;
    stat.platformFee += platformFee;
    stat.lofaDiscountLevy += lofaDiscountLevy;
    stat.proceeds += proceeds;
    stat.netProfitAfterTax += netProfitAfterTax;
  });

  searchResult.forEach((stat: PartnerRevenueStat) => {
    if (stat.totalSalesAmount != 0) {
      stat.returnRate = (stat.netProfitAfterTax / stat.totalSalesAmount) * 100;
    }
  });

  return Array.from(searchResult.values());
}

/**
 * 할인내역 자료 업로드합니다.
 * @param settlements: JSON string of discount data items list
 * @returns
 *
 */
export async function addDiscountData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();

    //이미 올라와있는 할인내역과 겹치는게 없는지 먼저 확인
    const discountData: DiscountData[] = JSON.parse(data);

    for (let i = 0; i < discountData.length; i++) {
      const item = discountData[i];
      const startDate = new Date(`${item.startDate}`);
      const endDate = new Date(`${item.endDate}`);
      const discountDataRef = collection(firestore, `discount-db`);
      let discountDataQuery = query(
        discountDataRef,
        where("productName", "==", item.productName),
        where("endDate", ">=", Timestamp.fromDate(startDate)),
        where("startDate", "<=", Timestamp.fromDate(endDate))
      );
      const querySnapshot = await getDocs(discountDataQuery);
      if (!querySnapshot.empty) {
        return `중복된 할인내역이 있습니다. (${dateToDayStr(
          startDate
        )}~${dateToDayStr(endDate)} ${item.productName})`;
      }
    }

    await setDoc(doc(firestore, `discount-data-add/data`), {
      json: data,
      updateTime: time,
    });
    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return (error.message as string) ?? (error as string);
  }
}

/**
 * 할인내역을 삭제합니다.
 * @param JSON string of {data: DiscountData, id: string}[]
 *
 */
export async function deleteDiscountData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `discount-data-delete/data`), {
      json: data,
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

export async function getDiscountData({
  startDate,
  endDate,
  partnerName,
  productName,
}: {
  startDate: Date;
  endDate: Date;
  partnerName: string;
  productName: string;
}) {
  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const discountDataRef = collection(firestore, `discount-db`);
  let discountDataQuery = query(
    discountDataRef,
    and(
      where("startDate", ">=", Timestamp.fromDate(startDate)),
      where("endDate", "<=", Timestamp.fromDate(endDate))
    )
  );

  if (partnerName.length > 0) {
    discountDataQuery = query(
      discountDataQuery,
      where("partnerName", "==", partnerName)
    );
  }

  const querySnap = await getDocs(discountDataQuery);
  const searchResult: { data: DocumentData; id: string }[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.productName.includes(productName)) {
      data.startDate = data.startDate.toDate();
      data.endDate = data.endDate.toDate();
      searchResult.push({ data: data, id: doc.id });
    }
  });
  return searchResult;
}
