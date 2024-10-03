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
import { sendResendBatchEmail, sendResendEmail } from "../resend.server";

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

export async function sendSettlementNoticeEmail({
  partnerList,
}: {
  partnerList: string[];
}) {
  addLog("sendSettlementNoticeEmail", { partnerList: partnerList });
  const profilesMap = await getAllPartnerProfiles();
  // let countForRateLimit = 0;
  // let successCount = 0;
  // let start = performance.now();
  const mailList = [];
  for (let i = 0; i < partnerList.length; i++) {
    // countForRateLimit++;
    // if (countForRateLimit >= 10) {
    //   countForRateLimit = 0;
    //   const end = performance.now();
    //   const spentTime = end - start;
    //   if (spentTime < 1000) {
    //     await new Promise((resolve) => setTimeout(resolve, 1000 - spentTime));
    //     console.log(`At index i, Waited for ${1000 - spentTime} milisecond`);
    //   } else {
    //     console.log(`At index i, spent time is ${spentTime}`);
    //   }
    //   start = performance.now();
    // }
    const partnerName = partnerList[i];
    const partnerProfile = profilesMap.get(partnerName);
    if (partnerProfile) {
      const email = partnerProfile.email;
      if (email && email.length > 0) {
        const html = `<div><div dir="ltr">안녕하세요.<br>로파서울 입니다.<br>전월 정산내역이 있어 안내드립니다.<br><br><span style="background-color:rgb(255,255,255)"><font size="4"><b style="">[정산내역 확인 후 계산서 발급]</b></font></span><div><span style="background-color:rgb(255,255,0)"><b style="">로파서울 파트너 사이트</b><br></span><div dir="ltr"><span style="background-color:rgb(255,255,0)"><b style=""><a href="https://lofaseoul-partner.netlify.app/login" target="_blank" style="" rel="noreferrer noopener">https://lofaseoul-partner.netlify.app/login</a></b><br></span><br><b style="background-color:rgb(255,255,255)">로파서울 파트너사이트의 정산 조회로 들어가셔서<br>전월의 정산금액과 배송비가 합산된 '최종 정산금액'만큼을 세금계산서 또는 현금영수증 발행 부탁드립니다.&nbsp;<br>본 정산 안내메일 발송일의 전월(판매가 이루어진 달)을 선택 해주셔야 합니다.</b></div><div dir="ltr"><b style=""><br></b><b><font color="#ff0000">* 세금계산서(일반과세자) 또는 현금영수증(간이과세자)이 발행되지 않으면 정산이 이루어지지 않으니, 반드시 말일 전까지 발행 부탁드립니다.&nbsp;</font></b><br><div><b style="background-color:rgb(255,255,0)"><br></b></div><div><b style="background-color:rgb(255,255,0)">비사업자 파트너 분들은 아래 링크를 통해 세금신고를 위한 정보를 기입 부탁드립니다.<br><a href="https://azttw5wwaus.typeform.com/to/leso5NDJ" target="_blank" style="" rel="noreferrer noopener">https://azttw5wwaus.typeform.com/to/leso5NDJ</a></b></div><div><b style=""><br><span style="background-color:rgb(255,255,255)">[정산관련 추가안내]</span></b></div><div>전월의 1일 - 말일 동안의 구매건 중<br>'배송 완료&nbsp;+ 구매자 승인'까지 <b>정상처리가 완료된 내역만 포함</b>됩니다.&nbsp;<br>(월말 주문건들은 포함되지 않을 수 있으며, 정상처리되면 다음달 정산내역에 포함됩니다.)<b style="background-color:rgb(255,255,0)"><br></b><br><b>매월 1일에 전월의 정산내역이 공유</b>되며,<br>세금계산서 및 현금영수증 발행이 확인되면 <b>말일에 이체가 진행</b>됩니다.<br>(말일이 공휴일이면 다음 영업일에 진행됩니다.)<br>말일에 지출증빙이 확인되지 않으면, 안내 메일이 전송되고 <b>10/20일 중간정산일에 정산지연건이 처리</b>됩니다.</div><div><br>파트너사이트를 통해 <b>첫 정산이신 파트너</b>분들은<br><b style="background-color:rgb(255,255,0)">손영준 매니저(<a href="mailto:syj@tabacprss.xyz" rel="noreferrer noopener" target="_blank">syj@tabacprss.xyz</a>)</b>에게 파트너 사이트 로그인 정보 및<br>사업자 등록증을 요청 부탁드립니다.<br><br>긴 글 읽어주시고, 정산과정에 협조 해주셔서 감사합니다.<br><br>로파서울 드림</div></div></div></div></div>`;
        const mailItem = {
          from: "tabacpress<syj@tabacpress.xyz>",
          to: email,
          subject: `[로파서울] ${partnerName} 정산안내 및 증빙 요청`,
          html: html,
        };
        mailList.push(mailItem);
        // const result = await sendResendEmail({
        //   to: email,
        //   subject: `[로파서울] ${partnerName} 정산안내 및 증빙 요청`,
        //   html: html,
        // });
        // successCount++;
        // if (result.error) {
        //   return {
        //     status: "error",
        //     message: result.error.message,
        //     partnerName: partnerName,
        //   };
        // }
      }
    } else {
      return {
        status: "error",
        message: `partner profile '${partnerName}' not found`,
        partnerName: partnerName,
      };
    }
  }
  

  const result = await sendResendBatchEmail({ mailList: mailList });
  console.log(result);

  if (result.error) {
    return {
      status: "error",
      message: result.error.message,
    };
  }

  return {
    status: "ok",
    message: `파트너 N곳에 메일이 전송되었습니다. (메일이 누락된 경우 제외 처리)`,
  };
}
