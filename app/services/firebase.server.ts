// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { SettlementItem } from "~/components/settlement_table";
import { PartnerProfile } from "~/components/partner_profile";
import { PossibleSellers } from "~/components/seller";
import { dateToDayStr, dayStrToDate } from "~/components/date";
import { OrderItem } from "~/components/order";
import {
  createAuthAccount,
  deleteAuthAccount,
  updateAuthAccount,
} from "./firebaseAdmin.server";

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

if (!firebaseApp?.apps.length || !firestore.apps.length) {
  firebaseApp = initializeApp(firebaseConfig);
  firestore = getFirestore(firebaseApp);
}

/**
 * 해당 ID의 계정이 어드민인지 확인합니다.
 * @param id: 아이디
 * @returns true: 어드민, false: 일반 파트너 (또는 존재하지 않는 계정)
 */
export async function isAdmin(id: string) {
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
      docSnap.data().id,
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
 * @param settlements: SettlementItem[], monthStr: string (입력할 월)
 * @returns
 *
 */
export async function addSettlements({
  settlements,
  monthStr,
}: {
  settlements: SettlementItem[];
  monthStr: string;
}) {
  const batch = writeBatch(firestore);
  const time = new Date().getTime();
  let partnersJson: any = {};

  const partners: string[] = [];
  settlements.forEach((item) => {
    if (!partners.includes(item.partnerName)) {
      partners.push(item.partnerName);
    }
  });

  const partnerSums = new Map<string, any>();

  for (let i = 0; i < partners.length; i++) {
    let sumItem = await getSettlementSum({
      partnerName: partners[i],
      monthStr: monthStr,
    });
    partnerSums.set(partners[i], sumItem);
  }

  settlements.forEach((item, index) => {
    let seller = "etc";
    if (PossibleSellers.includes(item.seller)) {
      seller = item.seller;
    }

    //현재 작업에서 해당 파트너의 정산합 추가한적 없으면 초기화
    if (partnersJson[item.partnerName] == undefined) {
      partnersJson[item.partnerName] = {
        settlement_etc: 0,
        shipping_etc: 0,
        orderNumbers: [],
      };

      PossibleSellers.forEach((seller) => {
        partnersJson[item.partnerName][`settlement_${seller}`] = 0;
        partnersJson[item.partnerName][`shipping_${seller}`] = 0;
      });
    }

    //현재 올리는 정산 + 기존 정산내역에 해당 주문번호 있으면 배송비 0원
    const partnerSum = partnerSums.get(item.partnerName);

    if (
      partnersJson[item.partnerName].orderNumbers.includes(item.orderNumber) ||
      partnerSum?.orderNumbers.includes(item.orderNumber)
    ) {
      item.shippingFee = 0;
    }

    /* partners에 총계 넣기 위한 계산 */

    //정산금액: (가격 * 수량)의 (100 - 수수료)%
    const newSettlement = Math.round(
      (item.price * item.amount * (100 - item.fee)) / 100.0
    );

    //현재 정산합에 추가
    partnersJson[item.partnerName][`settlement_${seller}`] += newSettlement;
    partnersJson[item.partnerName][`shipping_${seller}`] += item.shippingFee;

    partnersJson[item.partnerName].orderNumbers.push(item.orderNumber);

    //items에 해당 정산아이템 추가
    const itemDocName = `${time}_${index}`;
    let itemDocRef = doc(
      firestore,
      `settlements/${monthStr}/items`,
      itemDocName
    );
    batch.set(itemDocRef, item);
  });

  //partners에 각 파트너의 총계 추가
  for (let partnerName in partnersJson) {
    let prevSum = await getSettlementSum({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    let partnerDocRef = doc(
      firestore,
      `settlements/${monthStr}/partners`,
      partnerName
    );
    //기존 정산합이 없을 경우
    if (prevSum == null) {
      batch.set(partnerDocRef, partnersJson[partnerName]);
    } else {
      //기존 정산합이 있을 경우
      let newSum: any = {};
      if (prevSum["orderNumbers"].includes)
        newSum["orderNumbers"] = prevSum["orderNumbers"].concat(
          partnersJson[partnerName]["orderNumbers"]
        );
      PossibleSellers.forEach((seller) => {
        newSum[`settlement_${seller}`] =
          prevSum![`settlement_${seller}`] +
          partnersJson[partnerName][`settlement_${seller}`];
        newSum[`shipping_${seller}`] =
          prevSum![`shipping_${seller}`] +
          partnersJson[partnerName][`shipping_${seller}`];
      });
      newSum[`settlement_etc`] =
        prevSum["settlement_etc"] + partnersJson[partnerName][`settlement_etc`];
      newSum[`shipping_etc`] =
        prevSum["shipping_etc"] + partnersJson[partnerName][`shipping_etc`];
      batch.set(partnerDocRef, newSum);
    }
  }

  await batch.commit();

  await setDoc(doc(firestore, `settlements/${monthStr}`), {
    isShared: true,
  });
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
  return querySnap.docs.map((doc) => {
    return {
      partnerName: doc.id,
      data: doc.data(),
    };
  });
}

/**
 * 해당 정산내역들을 삭제합니다
 * @param monthStr: 월, settlements: 정산내역 (같은 파트너의 정산내역), partnerName: 파트너이름
 */
export async function deleteSettlements({
  settlements,
  monthStr,
  partnerName,
}: {
  settlements: SettlementItem[];
  monthStr: string;
  partnerName: string;
}) {
  if (settlements.length == 0) {
    console.log("error: settlement length = 0");
    return null;
  }

  const batch = writeBatch(firestore);

  function subtractArray(a: string[], b: string[]) {
    let hash = Object.create(null);
    b.forEach((val) => {
      hash[val] = (hash[val] || 0) + 1;
    });
    return a.filter((val) => {
      return !hash[val] || (hash[val]--, false);
    });
  }

  let prevSum = await getSettlementSum({
    partnerName: partnerName,
    monthStr: monthStr,
  });

  let newSum = prevSum;

  if (prevSum == null) {
    console.log("error: cannot get partner sum");
    return null;
  }

  // 주문번호 제거
  let deletingOrderNumbers = settlements.map((item) => item.orderNumber);
  let newOrderNumbers = subtractArray(
    prevSum.orderNumbers,
    deletingOrderNumbers
  );

  newSum!.orderNumbers = newOrderNumbers;

  for (let i = 0; i < settlements.length; i++) {
    let item = settlements[i];
    let seller = "etc";
    if (PossibleSellers.includes(item.seller)) {
      seller = item.seller;
    }

    /* partners에 총계 계산 */

    //정산금액: (가격 * 수량)의 (100 - 수수료)%
    const deletingAmount = Math.round(
      (item.price * item.amount * (100 - item.fee)) / 100.0
    );

    //현재 정산합에서 감산
    newSum![`settlement_${seller}`] -= deletingAmount;
    newSum![`shipping_${seller}`] -= item.shippingFee;

    //items에 해당 정산아이템 삭제
    const settlementsRef = collection(
      firestore,
      `settlements/${monthStr}/items`
    );

    const idQuery = query(
      settlementsRef,
      where("partnerName", "==", item.partnerName),
      where("productName", "==", item.productName),
      where("price", "==", item.price),
      where("receiver", "==", item.receiver),
      where("seller", "==", item.seller),
      where("optionName", "==", item.optionName),
      where("fee", "==", item.fee),
      where("orderer", "==", item.orderer),
      where("orderNumber", "==", item.orderNumber),
      where("shippingFee", "==", item.shippingFee),
      where("amount", "==", item.amount),
      limit(1)
    );
    const querySnap = await getDocs(idQuery);
    querySnap.forEach(async (doc) => {
      batch.delete(doc.ref);
    });
  }

  const docRef = doc(
    firestore,
    `settlements/${monthStr}/partners`,
    partnerName
  );

  //새 정산합 적용
  batch.set(docRef, newSum);

  batch.commit();
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
  const batch = writeBatch(firestore);
  const time = new Date().getTime();

  orders.forEach((item, index) => {
    //orders의 해당 날짜 items에 해당 주문건 아이템 추가
    const itemDocName = `${time}_${index}`;
    let itemDocRef = doc(firestore, `orders/${dayStr}/items`, itemDocName);
    batch.set(itemDocRef, item);

    //지연주문건에, 주문건 등록 날짜 (Timestamp) 추가해 해당 아이템 추가
    // (id를 똑같이 쓰므로 함께 삭제하거나 운송장 기입할 때 같은 id 삭제하면 됨)
    const date = dayStrToDate(dayStr);
    const timestamp = Timestamp.fromDate(date);
    const delayedOrderItem = { ...item, orderTimestamp: timestamp };
    let delayedOrderItemDocRef = doc(firestore, `delayed-orders`, itemDocName);
    batch.set(delayedOrderItemDocRef, delayedOrderItem);
  });

  await batch.commit();

  await setDoc(doc(firestore, `orders/${dayStr}`), {
    isShared: true,
  });
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
    console.log("error: settlement length = 0");
    return null;
  }

  const batch = writeBatch(firestore);

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
      batch.delete(document.ref);

      //지연주문건에서도 삭제
      let delayedOrderItemDocRef = doc(firestore, `delayed-orders`, docName);
      batch.delete(delayedOrderItemDocRef);
    });
  }

  batch.commit();
}

/**
 * 운송장이 기입된 주문서들을 공유합니다.
 * @param dayStr: 날짜 (XXXX-XX-XX), orders: 운송장 기입된 주문서 목록
 * 1. 해당 주문서의 운송장 내용이 업데이트되고,
 * 2. 그 주문서에 해당하는 지연주문건이 삭제되며,
 * 3. 운송장을 공유한 날짜에 완료운송장 항목을 추가합니다. (수정일 경우 삭제 후 재등록)
 */
export async function shareWaybills({
  dayStr,
  orders,
}: {
  orders: OrderItem[];
  dayStr: string;
}) {
  if (orders.length == 0) {
    return "오류: 입력된 운송장이 없습니다.";
  }

  const batch = writeBatch(firestore);

  let nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = dateToDayStr(new Date());

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

    if(querySnap.empty){
      console.log("error: not found");
      return "오류: 입력한 운송장에 해당하는 주문건을 찾을 수 없습니다."
    }

    querySnap.forEach(async (document) => {
      const docName = document.id;

      //기존에 운송장 입력한 기록이 있으면 날짜 확인
      const prevWaybillSharedDate = document.data().waybillSharedDate;

      //주문서에 운송장 내용 기입
      batch.update(document.ref, {
        shippingCompany: item.shippingCompany,
        waybillNumber: item.waybillNumber,
        waybillSharedDate: nextDayStr,
      });

      //지연주문건에서도 삭제
      let delayedOrderItemDocRef = doc(firestore, `delayed-orders`, docName);
      batch.delete(delayedOrderItemDocRef);

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
        batch.delete(prevWaybillDocRef);
      }

      //완료운송장에 추가
      let waybillItemDocRef = doc(
        firestore,
        `waybills/${nextDayStr}/items`,
        docName
      );
      batch.set(waybillItemDocRef, {...item, waybillSharedDate: nextDayStr});
    });
  }

  await setDoc(doc(firestore, `waybills/${nextDayStr}`), {
    isShared: true,
  });

  batch.commit();
  return true;
}
