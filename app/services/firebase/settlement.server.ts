import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { firestore } from "./firebaseInit.server";
import { addLog, getAllPartnerProfiles } from "./firebase.server";
import { sendAligoMessage } from "../aligo.server";
import { SettlementSumItem } from "~/components/settlement_sum";

/**
 * 정산내역을 추가합니다.
 * 추가 후 정산합계 기록도 수정합니다.
 * @param settlements: JSON string of settlement items list
 * @returns
 *
 */
export async function addSettlements({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    const data = {
      json: settlements,
      updateTime: time,
    };
    await setDoc(doc(firestore, `settlements-data-add/${monthStr}`), data);
    addLog("addSettlements", data);
    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 해당 정산내역들을 삭제합니다
 * @param monthStr: 월,
 * @param settlements: 대상 정산내역, JSON string of SettlementItem array
 */

export async function deleteSettlements({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    const data = {
      json: settlements,
      updateTime: time,
    };
    await setDoc(doc(firestore, `settlements-data-delete/${monthStr}`), data);
    addLog("deleteSettlements", data);
    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 해당 정산내역들의 배송비를 0원으로 만듭니다.
 * @param monthStr: 월
 * @param settlements: 대상 정산내역, JSON string of SettlementItem array
 */

export async function deleteSettlementsShippingFee({
  settlements,
  monthStr,
}: {
  settlements: string;
  monthStr: string;
}) {
  try {
    const time = new Date().getTime();
    const data = {
      json: settlements,
      updateTime: time,
    };
    await setDoc(
      doc(firestore, `settlements-data-delete-shipping-fee/${monthStr}`),
      data
    );
    addLog("addSettlementsShippingFee", data);

    return true;
  } catch (error: any) {
    sendAligoMessage({
      text: `[로파파트너] ${error.message ?? error}`,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
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

  const resultArray = querySnap.docs
    .map((doc) => {
      const data = doc.data();
      if (data.orderDate) {
        const date = data.orderDate.toDate();
        data.orderDate = date;
      }
      return data;
    })
    .sort((a, b) => {
      // orderDate가 없는 항목은 맨 앞으로 이동
      if (!a.orderDate) return -1;
      if (!b.orderDate) return 1;

      // orderDate가 있는 항목은 날짜 순으로 정렬
      return a.orderDate - b.orderDate;
    });

  return resultArray;
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
  const result: SettlementSumItem[] = [];
  const profilesMap = await getAllPartnerProfiles();
  for (let i = 0; i < querySnap.docs.length; i++) {
    const doc = querySnap.docs[i];
    const partnerProfile = profilesMap.get(doc.id);
    let brn = "";
    let bankAccount = "";
    let businessName = "";
    let businessTaxStandard = "";
    if (partnerProfile) {
      brn = partnerProfile.brn ?? "";
      bankAccount = partnerProfile.bankAccount ?? "";
      businessName = partnerProfile.businessName ?? "";
      businessTaxStandard = partnerProfile.businessTaxStandard ?? "";
    }
    result.push({
      partnerName: doc.id,
      data: doc.data(),
      brn: brn,
      bankAccount: bankAccount,
      businessName: businessName,
      businessTaxStandard: businessTaxStandard,
    });
  }
  return result;
}
