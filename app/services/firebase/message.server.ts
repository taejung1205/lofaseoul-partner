import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { sendAligoMessage } from "../aligo.server";
import { addLog, getPartnerProfile } from "./firebase.server";
import { firestore } from "./firebaseInit.server";
import { dateToDayStr, getTimezoneDate } from "~/utils/date";
import { MessageItem } from "~/components/message";

/**
 * 쪽지를 추가합니다
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function addMessage({
  partnerName,
  topic,
  detail,
  monthStr,
  isFromPartner,
}: {
  partnerName: string;
  topic: string;
  detail: string;
  monthStr: string;
  isFromPartner: boolean;
}) {
  try {
    const docName = `${new Date().getTime()}`;
    const data: any = {
      partnerName: partnerName,
      topic: topic,
      detail: detail,
      isShared: isFromPartner ? true : false,
      isFromPartner: isFromPartner,
    };
    if (isFromPartner) {
      const timestamp = Timestamp.fromDate(new Date());
      data.sharedDate = timestamp;
    }
    await setDoc(doc(firestore, `notices/${monthStr}/items/${docName}`), data);

    await setDoc(doc(firestore, `notices/${monthStr}`), { isShared: "true" });

    addLog("addNotice", data);

    return true;
  } catch (error: any) {
    return error.message ?? error;
  }
}

/**
 * 쪽지를 수정합니다.
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function editMessage({
  partnerName,
  topic,
  detail,
  monthStr,
  id,
}: {
  partnerName: string;
  topic: string;
  detail: string;
  monthStr: string;
  id: string;
}) {
  try {
    const data = {
      partnerName: partnerName,
      topic: topic,
      detail: detail,
      isShared: false,
    };
    await setDoc(doc(firestore, `notices/${monthStr}/items/${id}`), data);
    addLog("editNotice", { id: id, ...data });
    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 쪽지를 공유합니다.
 * @param month: 월, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function shareMessage({
  monthStr,
  id,
  partnerName,
  topic,
}: {
  monthStr: string;
  id: string;
  partnerName: string;
  topic: string;
}) {
  try {
    const timestamp = Timestamp.fromDate(new Date());
    const data = {
      isShared: true,
      sharedDate: timestamp,
    };
    await updateDoc(doc(firestore, `notices/${monthStr}/items/${id}`), data);

    const profile = await getPartnerProfile({ name: partnerName });
    const phone = profile?.phone ?? "";
    if (phone.length > 0) {
      const response = await sendAligoMessage({
        text: `[로파파트너] [${topic}]에 대하여 긴급알림이 있습니다. 파트너사이트의 '쪽지함'을 확인 부탁드립니다.`,
        receiver: phone,
      });
      if (response.result_code != 1) {
        throw Error(`ALIGO 오류: ${response.message}`);
      }
    }
    await addLog("shareNotice", { id: id, ...data });
    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 쪽지들을 불러옵니다
 * @param month: 월, partnerName: 파트너명 (비어있을 경우 모든 파트너)
 * @returns
 *  List of NoticeItem
 */
export async function getMessages({
  monthStr: month,
  partnerName,
}: {
  monthStr: string;
  partnerName: string;
}) {
  const noticesRef = collection(firestore, `notices/${month}/items`);
  let querySnap;
  if (partnerName.length > 0) {
    const noticeQuery = query(
      noticesRef,
      where("partnerName", "==", partnerName)
    );
    querySnap = await getDocs(noticeQuery);
  } else {
    querySnap = await getDocs(noticesRef);
  }

  const list: MessageItem[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    const timestamp: Timestamp | undefined = data.sharedDate;
    let sharedDate;
    if (timestamp != undefined) {
      sharedDate = dateToDayStr(timestamp.toDate());
    }
    list.push({
      partnerName: data.partnerName,
      docId: doc.id,
      sharedDate: sharedDate,
      topic: data.topic,
      detail: data.detail,
      replies: data.replies ?? [],
      isFromPartner: data.isFromPartner ?? false,
    });
  });
  return list;
}

/**
 * 공유된 쪽지들에 한하여 불러옵니다 (파트너 전용)
 * @param month: 월, partnerName: 파트너명
 * @returns
 *  List of NoticeItem
 */
export async function getSharedMessages({
  monthStr: month,
  partnerName,
}: {
  monthStr: string;
  partnerName: string;
}) {
  const noticesRef = collection(firestore, `notices/${month}/items`);
  let querySnap;
  const noticeQuery = query(
    noticesRef,
    where("partnerName", "==", partnerName),
    where("isShared", "==", true)
  );
  querySnap = await getDocs(noticeQuery);

  const list: MessageItem[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    const timestamp: Timestamp | undefined = data.sharedDate;
    let sharedDate;
    if (timestamp != undefined) {
      sharedDate = dateToDayStr(timestamp.toDate());
    }
    list.push({
      partnerName: data.partnerName,
      docId: doc.id,
      sharedDate: sharedDate,
      topic: data.topic,
      detail: data.detail,
      replies: data.replies ?? [],
      isFromPartner: data.isFromPartner ?? false,
    });
  });
  return list;
}

/**
 * 쪽지를 삭제합니다.
 * @param month: 월, id: 삭제할 쪽지 문서 아이디
 * @returns
 */
export async function deleteMessage({
  monthStr,
  id,
}: {
  monthStr: string;
  id: string;
}) {
  try {
    await deleteDoc(doc(firestore, `notices/${monthStr}/items/${id}`)).catch(
      (error) => {
        return error.message;
      }
    );
    addLog("deleteNotice", { monthStr: monthStr, id: id });
    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}

/**
 * 쪽지에 대해 답신합니다.
 * @param month: 월, id: 해당 doc id, reply: 답신
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function replyMessage({
  monthStr,
  id,
  reply,
  isAdmin,
}: {
  monthStr: string;
  id: string;
  reply: string;
  isAdmin: boolean;
}) {
  try {
    const time = getTimezoneDate(new Date());
    const dateStr = dateToDayStr(new Date());
    const timeStr = `${dateStr} ${time.getHours()}:${String(
      time.getMinutes()
    ).padStart(2, "0")}`;
    const replyStr = `${isAdmin ? "(어드민)" : "(파트너)"}[${timeStr}]
      ${reply}`;

    const data = {
      replies: arrayUnion(replyStr),
    };
    await updateDoc(doc(firestore, `notices/${monthStr}/items/${id}`), data);

    addLog("replyNotice", { monthStr: monthStr, id: id, ...data });

    return true;
  } catch (error: any) {
    await sendAligoMessage({
      text: error.message ?? error,
      receiver: "01023540973",
    });
    return error.message ?? error;
  }
}
