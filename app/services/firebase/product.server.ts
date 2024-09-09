// Import the functions you need from the SDKs you need
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Product } from "~/components/product";
import { firestore, storage } from "./firebaseInit.server";
import { addLog } from "./firebase.server";

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

  addLog("addProduct", product);

  const timestamp = Timestamp.fromDate(new Date());

  setDoc(doc(firestore, "products", product.productName), {
    ...product,
    uploadedDate: timestamp,
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
      where("partnerName", "==", partnerName),
      orderBy("uploadedDate", "desc")
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

    const productsQuery = query(
      productsRef,
      where("status", "!=", "임시저장"),
      orderBy("uploadedDate", "desc")
    );
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
      addLog("deleteProduct", {
        productName: productName,
        isDeletingStorage: isDeletingStorage,
      });
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
        addLog("deleteProducts", { productNameList: productNameList });
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
  const timestamp = Timestamp.fromDate(new Date());
  try {
    for (let i = 0; i < productNameList.length; i++) {
      const docRef = doc(firestore, "products", productNameList[i]);
      const docSnap = await getDoc(docRef);
      const data = {
        status: "승인완료",
        uploadedDate: timestamp,
      };
      if (docSnap.exists()) {
        updateDoc(doc(firestore, "products", productNameList[i]), data);
      }
      addLog("acceptProducts", { productName: productNameList[i], ...data });
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
  const timestamp = Timestamp.fromDate(new Date());
  try {
    for (let i = 0; i < productNameList.length; i++) {
      const docRef = doc(firestore, "products", productNameList[i]);
      const docSnap = await getDoc(docRef);
      const data = {
        status: "승인거부",
        uploadedDate: timestamp,
      };
      if (docSnap.exists()) {
        updateDoc(doc(firestore, "products", productNameList[i]), data);
      }
      addLog("deleteProducts", { productName: productNameList[i], ...data });
    }
  } catch (error: any) {
    return error.message ?? error;
  }

  return null;
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

  addLog("uploadProductImage", {
    file: file.name,
    usage: usage,
    id: id,
    index: index,
  });

  return downloadURL;
}
