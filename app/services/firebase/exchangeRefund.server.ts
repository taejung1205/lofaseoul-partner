// Import the functions you need from the SDKs you need
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { sendAligoMessage } from "../aligo.server";
import { ExchangeRefundData } from "~/components/exchange_refund";
import { firestore } from "./firebaseInit.server";
import { addLog } from "./firebase.server";

export async function applyExchangeRefundData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    const parsedData: ExchangeRefundData[] = JSON.parse(data);
    const revenueDataBatch = writeBatch(firestore); // 한 번의 batch 생성

    let modifiedCount = 0; // 수정된 문서 수 카운트

    const promises = parsedData.map(async (item) => {
      const revenueDataRef = collection(firestore, `revenue-db`);
      const revenueDataQuery = query(
        revenueDataRef,
        where("productName", "==", item.productName),
        where("orderNumber", "==", item.orderNumber)
      );

      const querySnapshot = await getDocs(revenueDataQuery);

      // 각 문서 업데이트
      querySnapshot.forEach((docSnapshot) => {
        const docRef = docSnapshot.ref;
        revenueDataBatch.update(docRef, {
          cs: item.cs,
          orderStatus: item.orderStatus,
        });
      });

      // 비동기 함수 내에서 리턴된 값이 Promise로 감싸짐
      return querySnapshot.size;
    });

    // 모든 비동기 작업이 완료된 후 처리된 문서 수를 계산
    const results = await Promise.all(promises);
    modifiedCount = results.reduce((sum, current) => sum + current, 0); // 총 수정된 문서 수 계산

    // 배치 커밋
    await revenueDataBatch.commit();
    console.log("Batch committed");

    // 로그 남기기

    addLog("applyExchangeRefundData", {
      json: data,
      updateTime: time,
    });

    return { status: "ok", count: modifiedCount }; // 수정된 문서 수 반환
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return {
      status: "error",
      message: (error.message as string) ?? (error as string),
    };
  }
}
