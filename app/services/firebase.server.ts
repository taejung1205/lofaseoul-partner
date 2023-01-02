// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";
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

export async function doLogin({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
    const docRef = doc(firestore, "accounts", username);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        if(process.env.PASSWORD_ENCRYPTION_KEY !== undefined){
            const keyWordArray = crypto.enc.Utf8.parse( process.env.PASSWORD_ENCRYPTION_KEY! );
            const cipher = crypto.AES.encrypt(password, keyWordArray, { mode: crypto.mode.ECB }).toString();
            if(cipher === docSnap.data().password){
                return true;
            } else {
                return false;
            }
        }
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
        return false;
      }
}
