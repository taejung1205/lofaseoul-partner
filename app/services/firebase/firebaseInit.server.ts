import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

if (!firebaseApp?.apps.length) {
  firebaseApp = initializeApp(firebaseConfig);
}

export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

/**
 * Firebase를 위한 설정입니다. Client side에서 로그인하기 위해 사용합니다.
 * @returns firebaseConfig
 */
export function getFirebaseConfig() {
  return firebaseConfig;
}
