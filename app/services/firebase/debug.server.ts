// Your web app's Firebase configuration

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { addLog, getAllPartnerProfiles, getAllSellerProfiles } from "./firebase.server";
import { LofaSellers } from "~/components/seller";
import { firestore, storage } from "./firebaseInit.server";
import { dateToDayStr, getTimezoneDate } from "~/utils/date";

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

export async function debug_addGwangjuBiennaleFee() {
  const accountsRef = collection(firestore, "accounts");
  const querySnap = await getDocs(accountsRef);
  querySnap.docs.forEach(async (item) => {
    const data = item.data();
    if (!data.gwangjuBiennaleFee) {
      await updateDoc(doc(firestore, "accounts", data.name), {
        gwangjuBiennaleFee: 38,
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
      const monthStr = month.toString().padStart(2, "0"); // '01', '02', ..., '12'
      const settlementDocRef = collection(
        firestore,
        "settlements",
        `${year}년 ${monthStr}월`,
        "items"
      );

      const itemsSnap = await getDocs(settlementDocRef);

      itemsSnap.docs.forEach(async (item) => {
        await updateDoc(
          doc(
            firestore,
            "settlements",
            `${year}년 ${monthStr}월`,
            "items",
            item.id
          ),
          {
            isDiscounted: false,
          }
        ).catch((error) => {
          console.error(`Error updating document ${item.id}: `, error);
        });
      });
    }

    console.log("All items have been updated successfully.");
  } catch (error) {
    console.error("Error initializing isDiscounted fields: ", error);
  }
}

export async function debug_addUploadedDate() {
  const accountsRef = collection(firestore, "products");
  const querySnap = await getDocs(accountsRef);
  querySnap.docs.forEach(async (item) => {
    const data = item.data();
    const id = data.id;
    const year = parseInt(`20${id.substring(0, 2)}`, 10);
    const month = parseInt(id.substring(2, 4), 10) - 1; // 월은 0부터 시작하므로 -1
    const day = parseInt(id.substring(4, 6), 10);
    const date = new Date(year, month, day);
    if (!data.uploadedDate) {
      await updateDoc(doc(firestore, "products", item.id), {
        uploadedDate: date,
      }).catch((error) => {
        return error.message;
      });
    }
  });
}

export async function debug_deleteAllTestRevenueData() {
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("partnerName", "==", "test")
  );
  try {
    // 쿼리로 문서들 가져오기
    const querySnapshot = await getDocs(revenueDataQuery);

    // 문서들을 반복하면서 삭제
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteDoc(doc(firestore, `revenue-db/${docSnapshot.id}`))
    );

    // 모든 삭제 작업이 완료될 때까지 대기
    await Promise.all(deletePromises);

    console.log("All test revenue data deleted successfully.");
  } catch (error) {
    console.error("Error deleting test revenue data:", error);
  }
}

export async function debug_addExtraDataToRevenueDB() {
  const partnerProfiles = await getAllPartnerProfiles(true);
  const sellers = await getAllSellerProfiles();

  const revenueDataRef = collection(firestore, `revenue-db`);

  try {
    // 쿼리로 문서들 가져오기
    const querySnapshot = await getDocs(revenueDataRef);

    // 문서들을 반복하면서 수정
    const promises = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      const partnerProfile = partnerProfiles.get(data.partnerName);

      if (partnerProfile) {
        const isLofa = LofaSellers.includes(data.seller);

        const commonFeeRate = isLofa
          ? partnerProfile.lofaFee
          : partnerProfile.otherFee;

        const businessTaxStandard = partnerProfile.businessTaxStandard;

        const sellerProfile = sellers.get(data.seller);

        let platformFeeRate = 0;
        if (sellerProfile) {
          platformFeeRate = sellerProfile.fee;
        }

        updateDoc(doc(firestore, `revenue-db/${docSnapshot.id}`), {
          commonFeeRate: commonFeeRate,
          businessTaxStandard: businessTaxStandard,
          platformFeeRate: platformFeeRate,
        });

        console.log(`${docSnapshot.id} editted`);
      } else {
        console.log(`${data.partnerName} not found`);
      }
    });

    // 모든 삭제 작업이 완료될 때까지 대기
    await Promise.all(promises);

    console.log("All test revenue data editted successfully.");
  } catch (error) {
    console.error("Error editting test revenue data:", error);
  }
}

export async function debug_fixRevenueDataProviderName(
  from: string,
  to: string
) {
  const revenueDataRef = collection(firestore, `revenue-db`);
  const revenueDataQuery = query(
    revenueDataRef,
    where("partnerName", "==", from)
  );

  try {
    // 쿼리로 문서들 가져오기
    const querySnapshot = await getDocs(revenueDataQuery);

    // 문서들을 반복하면서 수정
    const promises = querySnapshot.docs.map((docSnapshot) => {
      updateDoc(doc(firestore, `revenue-db/${docSnapshot.id}`), {
        partnerName: to,
      });
    });

    // 모든 삭제 작업이 완료될 때까지 대기
    await Promise.all(promises);

    console.log("All test revenue data editted successfully.");
  } catch (error) {
    console.error("Error editting test revenue data:", error);
  }
}

export async function debug_changeNoticeToMessage() {
  try {
    const year = 24;

    for (let month = 1; month <= 9; month++) {
      const monthStr = month.toString().padStart(2, "0"); // '01', '02', ..., '12'

      await setDoc(doc(firestore, "messages", `${year}년 ${monthStr}월`), {
        isShared: true,
      });

      const noticeItemsCollectionRef = collection(
        firestore,
        "notices",
        `${year}년 ${monthStr}월`,
        "items"
      );

      const itemsSnap = await getDocs(noticeItemsCollectionRef);

      itemsSnap.docs.forEach(async (item) => {
        const data = item.data();
        await setDoc(
          doc(
            firestore,
            "messages",
            `${year}년 ${monthStr}월`,
            "items",
            item.id
          ),
          data
        ).catch((error) => {
          console.error(`Error updating document ${item.id}: `, error);
        });
      });
    }

    console.log("All items have been updated successfully.");
  } catch (error) {
    console.error("Error initializing isDiscounted fields: ", error);
  }
}

export async function debug_changePartnerNameToProviderName() {
  const revenueDataRef = collection(firestore, `revenue-db`);

  try {
    // 쿼리로 문서들 가져오기
    const querySnapshot = await getDocs(revenueDataRef);

    // 문서들을 반복하면서 수정
    const promises = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      updateDoc(doc(firestore, `revenue-db/${docSnapshot.id}`), {
        providerName: data.partnerName,
      });
    });

    // 모든 삭제 작업이 완료될 때까지 대기
    await Promise.all(promises);

    console.log("All test revenue data editted successfully.");
  } catch (error) {
    console.error("Error editting test revenue data:", error);
  }
}

export async function debug_addProviderNameToDelayedOrders() {
  const revenueDataRef = collection(firestore, `delayed-orders`);

  try {
    // 쿼리로 문서들 가져오기
    const querySnapshot = await getDocs(revenueDataRef);

    const partnerProfiles = await getAllPartnerProfiles();

    // 문서들을 반복하면서 수정
    const promises = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();

      const providerName =
        partnerProfiles.get(data?.partnerName ?? "")?.providerName ?? "";
      if (providerName.length == 0) {
        console.log(`partnerName of ${data?.partnerName} not found`);
      }

      updateDoc(doc(firestore, `delayed-orders/${docSnapshot.id}`), {
        providerName: providerName,
      });
    });

    // 모든 삭제 작업이 완료될 때까지 대기
    await Promise.all(promises);

    console.log("All editted successfully.");
  } catch (error) {
    console.error("Error editting test revenue data:", error);
  }
}

export async function debug_addProviderNameToWaybills() {
  const ordersCollectionRef = collection(firestore, "waybills");

  try {
    // Fetch all order documents from the 'orders' collection
    const ordersSnapshot = await getDocs(ordersCollectionRef);

    // Initialize Firestore batch
    let batch = writeBatch(firestore);
    const BATCH_SIZE = 500; // Firestore allows a maximum of 500 writes per batch
    let batchCount = 0;

    const partnerProfiles = await getAllPartnerProfiles();

    // Loop through each order document
    for (const orderDoc of ordersSnapshot.docs) {
      const orderId = orderDoc.id;
      const itemsCollectionRef = collection(
        firestore,
        `waybills/${orderId}/items`
      );
      const itemsSnapshot = await getDocs(itemsCollectionRef);

      // Loop through each item in the 'items' subcollection
      for (const itemDoc of itemsSnapshot.docs) {
        const itemRef = doc(firestore, `waybills/${orderId}/items`, itemDoc.id);
        const data = (await getDoc(itemRef)).data();

        const providerName =
          partnerProfiles.get(data?.partnerName ?? "")?.providerName ?? "";
        if (providerName.length == 0) {
          console.log(`partnerName of ${data?.partnerName} not found`);
        }

        // Add update operation to the batch
        batch.update(itemRef, { providerName: providerName });
        batchCount++;

        // If the batch size reaches the limit, commit the batch and start a new one
        if (batchCount === BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch of ${BATCH_SIZE} items committed.`);

          // Start a new batch
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      }
      console.log(`${orderId} added .`);
    }

    // Commit the batch update
    await batch.commit();
    console.log("All waybill items updated successfully.");
  } catch (error) {
    console.error("Error updating items:", error);
  }
}

export async function debug_timezone() {
  let day = getTimezoneDate(new Date());
  day.setDate(day.getDate() + 1);
  const hour = day.getHours();
  const nextDayStr = dateToDayStr(day);

  addLog("timezone", {
    date: nextDayStr,
    hour: hour
  })
}
