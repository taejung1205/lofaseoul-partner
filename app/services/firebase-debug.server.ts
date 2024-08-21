// Your web app's Firebase configuration

import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";

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

export async function debug_fixProductStorage() {
  const productsRef = collection(firestore, `products`);
  const productsQuery = query(
    productsRef,
    where("partnerName", "==", "homethus")
  );
  const querySnapshot = await getDocs(productsQuery);
  const usages = ["main", "thumbnail", "detail", "extra"];
  querySnapshot.forEach(async (item) => {
    const docId = item.id;
    const data = item.data();
    const id = data.id;
    const updateDataJson: any = {
      detailImageURLList: [],
      extraImageURLList: [],
    };

    // 폴더 내의 모든 파일과 하위 폴더 목록 가져오기
    const promises = usages.map(async (usage) => {
      const oldFolderRef = ref(storage, `${data.productName}/${usage}`);
      const listResult = await listAll(oldFolderRef);
      console.log(
        `${data.productName}/${usage} length`,
        listResult.items.length
      );

      // 모든 파일 복사 및 삭제
      const promises = listResult.items.map(async (itemRef, index) => {
        console.log("PROMISE");
        const newFolderRef = ref(
          storage,
          `product-images/${id}/${usage}/${usage}_${index}`
        );
        const downloadURL = await getDownloadURL(itemRef);
        console.log(
          `${data.productName}/${usage} ${index} previous downloadURL`,
          downloadURL
        );
        const response = await fetch(downloadURL);
        const fileData = await response.blob(); // Get file data as a Blob
        await uploadBytes(newFolderRef, fileData).then(async (snapshot) => {
          const url = await getDownloadURL(snapshot.ref);
          console.log(
            `product-images/${id}/${usage}/${usage}_${index} new downloadURL`,
            url
          );
          switch (usage) {
            case "main":
              updateDataJson["mainImageURL"] = url;
              break;
            case "thumbnail":
              updateDataJson["thumbnailImageURL"] = url;
              break;
            case "detail":
              updateDataJson["detailImageURLList"].push(url);
              break;
            case "extra":
              updateDataJson["extraImageURLList"].push(url);
              break;
          }
        });
        return deleteObject(itemRef);
      });

      await Promise.all(promises);

      // 모든 삭제 작업이 완료될 때까지 기다림
      console.log(`All files in folder '${id} ${usage}' have been rename.`);
    });
    await Promise.all(promises);
    console.log("update", updateDataJson);
    await updateDoc(doc(firestore, "products", docId), updateDataJson);
  });
}

export async function debug_fixPartnerProfileTaxStandard() {
  const accountsRef = collection(firestore, "accounts");
  const querySnap = await getDocs(accountsRef);
  querySnap.docs.forEach(async (item) => {
    const data = item.data();
    if (!data.businessTaxStandard) {
      await updateDoc(doc(firestore, "accounts", data.name), {
        businessTaxStandard: "일반",
      }).catch((error) => {
        return error.message;
      });
    }
  });
}

export async function debug_fixPartnerProviderNameStandard() {
  const accountsRef = collection(firestore, "accounts");
  const querySnap = await getDocs(accountsRef);
  querySnap.docs.forEach(async (item) => {
    const data = item.data();
    if (!data.providerName) {
      await updateDoc(doc(firestore, "accounts", data.name), {
        providerName: data.name,
      }).catch((error) => {
        return error.message;
      });
    }
  });
}

export async function debug_initializeIsDiscountedForSettlements() {
    try {
      const year = 24;
  
      for (let month = 1; month <= 8; month++) {
        const monthStr = month.toString().padStart(2, '0'); // '01', '02', ..., '12'
        const settlementDocRef = collection(firestore, "settlements", `${year}년 ${monthStr}월`, "items");
  
        const itemsSnap = await getDocs(settlementDocRef);
  
        itemsSnap.docs.forEach(async (item) => {
          await updateDoc(doc(firestore, "settlements", `${year}년 ${monthStr}월`, "items", item.id), {
            isDiscounted: false,
          }).catch((error) => {
            console.error(`Error updating document ${item.id}: `, error);
          });
        });
      }
  
      console.log("All items have been updated successfully.");
    } catch (error) {
      console.error("Error initializing isDiscounted fields: ", error);
    }
  }