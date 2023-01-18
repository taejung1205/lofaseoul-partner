// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import crypto from "crypto-js";
import { SettlementItem } from "~/components/settlement";
import { PartnerProfile } from "~/components/partner_profile";
import { PossibleSellers } from "~/components/seller";

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
      // console.log(doc.data());
      // const parsedKey = crypto.enc.Utf8.parse(
      //   process.env.PASSWORD_ENCRYPTION_KEY!
      // );
      // const cipher = crypto.AES.encrypt(password, parsedKey, {
      //   mode: crypto.mode.ECB,
      // }).toString();

      // if (cipher === doc.data().password) {
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
    console.log("not found");
    return null;
  }
}

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

export async function deletePartnerProfile({ name }: { name: string }) {
  const result = await deleteDoc(doc(firestore, "accounts", name));
  return result;
}

export async function addSettlement({
  settlements,
  monthStr,
}: {
  settlements: SettlementItem[];
  monthStr: string;
}) {
  const batch = writeBatch(firestore);
  const time = new Date().getTime();
  let partnersJson: any = {};

  settlements.forEach((item, index) => {

    //items에 해당 정산아이템 추가
    const itemDocName = `${time}_${index}`;
    let itemDocRef = doc(
      firestore,
      `settlements/${monthStr}/items`,
      itemDocName
    );
    batch.set(itemDocRef, item);

    /* partners에 총계 넣기 위한 계산 */

    //정산금액: (가격 * 수량)의 (100 - 수수료)%
    const newSettlement = Math.round(
      (item.price * item.amount * (100 - item.fee)) / 100.0
    );

    let seller = "etc";
    if (PossibleSellers.includes(item.seller)) {
      seller = item.seller;
    }

    if (partnersJson[item.partnerName] == undefined) {
      partnersJson[item.partnerName] = {
        settlement_29cm: 0,
        shipping_29cm: 0,
        settlement_EQL: 0,
        shipping_EQL: 0,
        settlement_로파공홈: 0,
        shipping_로파공홈: 0,
        settlement_오늘의집: 0,
        shipping_오늘의집: 0,
        settlement_카카오: 0,
        shipping_카카오: 0,
        settlement_etc: 0,
        shipping_etc: 0,
        orderNumbers: [],
      };
    }

    if(!partnersJson[item.partnerName].orderNumbers.includes(item.orderNumber)){
      partnersJson[item.partnerName][`shipping_${seller}`] += item.shippingFee;
    }

    partnersJson[item.partnerName][`settlement_${seller}`] += newSettlement;

    partnersJson[item.partnerName].orderNumbers.push(item.orderNumber);


  });
 
  //partners에 각 파트너의 총계 추가
  for(let partnerName in partnersJson){
    let partnerDocRef = doc(
      firestore,
    `settlements/${monthStr}/partners`,
      partnerName
    );
    batch.set(partnerDocRef, partnersJson[partnerName]);
  }

  await batch.commit();

  await setDoc(doc(firestore, `settlements/${monthStr}`), {
    isShared: true,
  });
}

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
 * 정산 데이터를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  해당 월 파트너의 판매처별 정산 금액 합 (settlement_{판매처이름}, shipping_{판매처이름}) 
 *  없을 경우 null
 */
export async function getSettlementSum({
  partnerName,
  monthStr
}: {
  partnerName: string;
  monthStr: string;
}){
  const docRef = doc(firestore, `settlements/${monthStr}/partners`, partnerName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}