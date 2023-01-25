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
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { SettlementItem } from "~/components/settlement_table";
import { PartnerProfile } from "~/components/partner_profile";
import { PossibleSellers } from "~/components/seller";
import { SettlementSumItem } from "~/components/settlement_sum";
import { dateToDayStr } from "~/components/date";
import { OrderItem } from "~/components/order";

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
 * 파이어베이스를 통해 로그인을 시도합니다.
 * @param param0
 * @returns
 * fail: 로그인 실패
 * admin: 어드민 계정 로그인
 * 그 외 string: 일반 파트너 계정 로그인 및 그 이름
 */
export async function doLogin({
  id,
  password,
}: {
  id: string;
  password: string;
}) {
  const accountsRef = collection(firestore, "accounts");
  const idQuery = query(accountsRef, where("id", "==", id));
  const querySnap = await getDocs(idQuery);
  if (!querySnap.empty && process.env.PASSWORD_ENCRYPTION_KEY !== undefined) {
    let result = "fail";
    querySnap.forEach((doc) => {
      if (password === doc.data().password) {
        if (doc.data().isAdmin) {
          result = "admin";
        } else {
          result = doc.data().name;
        }
      }
    });
    return result;
  } else {
    return "fail";
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
 * 파트너 정보를 추가합니다.
 * @param partnerProfie: PartnerProfile
 * @returns
 *
 */
export async function addPartnerProfile({
  partnerProfile,
}: {
  partnerProfile: PartnerProfile;
}) {
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
  partnerProfiles.forEach((item, index) => {
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
  });
  await batch.commit();
}

/**
 * 파트너 정보를 삭제합니다.
 * @param name: string (해당 파트너 이름)
 * @returns
 *
 */
export async function deletePartnerProfile({ name }: { name: string }) {
  const result = await deleteDoc(doc(firestore, "accounts", name));
  return result;
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
    //items에 해당 정산아이템 추가
    const itemDocName = `${time}_${index}`;
    let itemDocRef = doc(firestore, `orders/${dayStr}/items`, itemDocName);
    batch.set(itemDocRef, item);
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
  const querySnap = await getDocs(ordersRef);
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

    //items에 해당 정산아이템 삭제
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
      where("shippingCompanyNumber", "==", item.shippingCompanyNumber),
      where("waybillNumber", "==", item.waybillNumber),
      where("zipCode", "==", item.zipCode),
      limit(1)
    );
    const querySnap = await getDocs(idQuery);
    querySnap.forEach(async (doc) => {
      batch.delete(doc.ref);
    });
  }

  batch.commit();
}
