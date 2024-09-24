// Import the functions you need from the SDKs you need
import {
  and,
  collection,
  doc,
  DocumentData,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { dateToDayStr } from "~/utils/date";
import { sendAligoMessage } from "../aligo.server";
import { DiscountData } from "~/components/discount";
import { firestore } from "./firebaseInit.server";
import { addLog } from "./firebase.server";

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
        where("seller", "==", item.seller),
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
    addLog("addDiscountData", {
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
    addLog("deleteDiscountData", {
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
  seller,
  providerName,
  productName,
}: {
  startDate: Date;
  endDate: Date;
  seller: string;
  providerName: string;
  productName: string;
}) {
  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const discountDataRef = collection(firestore, `discount-db`);
  const isUsingSeller = seller.length > 0 && seller != "all";
  const isUsingProviderName = providerName.length > 0;
  let discountDataQuery = query(
    discountDataRef,
    and(
      where("startDate", "<=", Timestamp.fromDate(endDate)),
      where("endDate", ">=", Timestamp.fromDate(startDate)),
      where("seller", isUsingSeller ? "==" : ">=", isUsingSeller ? seller : ""),
      where(
        "providerName",
        isUsingProviderName ? "==" : ">=",
        isUsingProviderName ? providerName : ""
      )
    )
  );

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
