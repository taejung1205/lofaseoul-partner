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
} from "firebase/firestore";
import crypto from "crypto-js";

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
 *
 */
export async function getPartnerProfiles() {
  const accountsRef = collection(firestore, "accounts");
  const partnerQuery = query(accountsRef, where("isAdmin", "==", false));
  const querySnap = await getDocs(partnerQuery);
  return querySnap.docs.map((doc) => doc.data());
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
  name,
  id,
  password,
  email,
  phone,
  lofaFee,
  otherFee,
  shippingFee,
}: {
  name: string;
  id: string;
  password: string;
  email: string;
  phone: string;
  lofaFee: number;
  otherFee: number;
  shippingFee: number;
}) {
  const result = await setDoc(doc(firestore, "accounts", name), {
    name: name,
    id: id,
    password: password,
    email: email,
    phone: phone,
    lofaFee: lofaFee,
    otherFee: otherFee,
    shippingFee: shippingFee,
    isAdmin: false,
  });
  return result;
}

export async function deletePartnerProfile({ name }: { name: string }) {
  const result = await deleteDoc(doc(firestore, "accounts", name));
  return result;
}
