// Import the functions you need from the SDKs you need
import {
  and,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
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
import { PartnerProfile } from "~/components/partner_profile";
import { dateToDayStr, getTimezoneDate } from "~/utils/date";
import { OrderItem } from "~/components/order";
import {
  createAuthAccount,
  deleteAuthAccount,
  updateAuthAccount,
} from "./firebaseAdmin.server";
import { emailToId } from "~/utils/account";
import { sendAligoMessage } from "../aligo.server";
import { NoticeItem } from "~/components/notice";
import { Product } from "~/components/product";
import { sendResendEmail } from "../resend.server";
import {
  PossibleCS,
  PossibleOrderStatus,
  RevenueData,
} from "~/components/revenue_data";
import { PartnerRevenueStat } from "~/components/revenue_stat";
import { LofaSellers, NormalPriceStandardSellers } from "~/components/seller";
import { DiscountData } from "~/components/discount";
import { getIdFromTime } from "~/components/date";
import { ExchangeRefundData } from "~/components/exchange_refund";
import { firestore, storage } from "./firebaseInit.server";

/**
 * 해당 ID의 계정이 어드민인지 확인합니다.
 * @param email: 이메일
 * @returns true: 어드민, false: 일반 파트너 (또는 존재하지 않는 계정)
 */
export async function isAdmin(email: string) {
  const id = emailToId(email);
  const accountsRef = collection(firestore, "accounts");
  const idQuery = query(accountsRef, where("id", "==", id), limit(1));
  const querySnap = await getDocs(idQuery);
  if (!querySnap.empty) {
    let result = false;
    querySnap.forEach((doc) => {
      if (doc.data().isAdmin) {
        result = true;
      }
    });
    return result;
  } else {
    return false;
  }
}

/**
 * 해당 ID의 계정이 스태프인지 확인합니다.
 * @param email: 이메일
 * @returns true: 스태프, false: 일반 파트너 (또는 존재하지 않는 계정)
 */
export async function isStaff(email: string) {
  const id = emailToId(email);
  const accountsRef = collection(firestore, "accounts");
  const idQuery = query(accountsRef, where("id", "==", id), limit(1));
  const querySnap = await getDocs(idQuery);
  if (!querySnap.empty) {
    let result = false;
    querySnap.forEach((doc) => {
      if (doc.data().isStaff) {
        result = true;
      }
    });
    return result;
  } else {
    return false;
  }
}

/**
 * 판매자의 정보들을 불러옵니다
 * @param param0
 * @returns
 *  Map(key: (partner name), value: SellerProfile)
 */
export async function getAllSellerProfiles() {
  const accountsRef = collection(firestore, "seller");
  const querySnap = await getDocs(accountsRef);
  const map = new Map<string, any>();
  querySnap.docs.forEach((doc) => {
    map.set(doc.id, doc.data());
  });
  return map;
}

/**
 * 판매처 정보를  수정합니다.
 * @param name: string
 * @param fee: number
 * @returns
 * 에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function editSellerProfile(name: string, fee: number) {
  const result = await updateDoc(doc(firestore, "seller", name), {
    fee: fee,
  }).catch((error) => {
    return error.message;
  });

  return result;
}
/**
 * 파트너의 정보들을 불러옵니다
 * useProviderName = true일 경우, key값으로 공급처명을 사용합니다.
 * @param useProviderName: boolean
 * @returns
 *  Map(key: (partner name), value: PartnerProfile)
 */
export async function getAllPartnerProfiles(useProviderName = false) {
  const accountsRef = collection(firestore, "accounts");
  const partnerQuery = query(accountsRef, where("isAdmin", "==", false));
  const querySnap = await getDocs(partnerQuery);
  const map = new Map<string, any>();
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (useProviderName) {
      map.set(data.providerName, data);
    } else {
      map.set(doc.id, data);
    }
  });
  return map;
}

/**
 * 해당 이름의 파트너의 정보들을 불러옵니다
 * @param param0
 * @returns
 *
 */
export async function getPartnerProfile({ name }: { name: string }) {
  const docRef = doc(firestore, "accounts", name);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

/**
 * 파트너 정보를 추가하거나 수정합니다.
 * @param partnerProfie: PartnerProfile
 * @returns
 * 에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function addPartnerProfile({
  partnerProfile,
}: {
  partnerProfile: PartnerProfile;
}) {
  const docRef = doc(firestore, "accounts", partnerProfile.name);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const result = await updateAuthAccount(
      docSnap.id,
      partnerProfile.id,
      partnerProfile.password
    );
    if (typeof result == "string") {
      return result;
    }
  } else {
    const result = await createAuthAccount(
      partnerProfile.id,
      partnerProfile.password,
      partnerProfile.name
    );
    if (typeof result == "string") {
      return result;
    }
  }

  const data: PartnerProfile = {
    name: partnerProfile.name,
    id: partnerProfile.id,
    password: partnerProfile.password,
    email: partnerProfile.email,
    phone: partnerProfile.phone,
    lofaFee: partnerProfile.lofaFee,
    otherFee: partnerProfile.otherFee,
    shippingFee: partnerProfile.shippingFee,
    brn: partnerProfile.brn,
    bankAccount: partnerProfile.bankAccount,
    businessName: partnerProfile.businessName,
    businessTaxStandard: partnerProfile.businessTaxStandard,
    providerName: partnerProfile.providerName,
    productCategory: partnerProfile.productCategory,
    isAdmin: false,
  };

  const result = await setDoc(
    doc(firestore, "accounts", partnerProfile.name),
    data
  ).catch((error) => {
    return error.message;
  });

  addLog("addPartnerProfile", data);

  return result;
}

/**
 * 파트너 정보를 삭제합니다.
 * @param id: string (해당 파트너 아이디)
 * @returns
 *  에러가 있을 경우 string
 * 정상적일 경우 null
 */
export async function deletePartnerProfile({ name }: { name: string }) {
  const authResult = await deleteAuthAccount(name);
  if (typeof authResult == "string") {
    console.log(authResult);
    return authResult;
  }

  const firestoreResult = await deleteDoc(
    doc(firestore, "accounts", name)
  ).catch((error) => {
    return error.message;
  });

  addLog("deletePartnerProfile", { docName: name });
  return firestoreResult;
}

/**
 * 모든 지연주문건을 불러옵니다
 * @param
 * @returns
 *  Array of OrderItem
 */
export async function getAllDelayedOrders() {
  const ordersRef = collection(firestore, `delayed-orders`);
  const ordersQuery = query(ordersRef, orderBy("orderTimestamp"));
  const querySnap = await getDocs(ordersQuery);
  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 해당 파트너의 지연주문건을 불러옵니다.
 * @param partnerName: 파트너 이름
 * @returns
 *  Array of OrderItem
 */
export async function getPartnerDelayedOrders(partnerName: string) {
  const ordersRef = collection(firestore, `delayed-orders`);

  const ordersQuery = query(
    ordersRef,
    where("partnerName", "==", partnerName),
    orderBy("orderTimestamp")
  );
  const querySnap = await getDocs(ordersQuery);

  return querySnap.docs.map((doc) => doc.data());
}

/**
 * 지연주문건의 운송장을 입력합니다
 * @param orders: 입력한 운송장
 * 1. 지연주문건에서 해당 운송장이 삭제되고,
 * 2. 원 주문건의 운송장 내역 수정되며,
 * 2. 완료운송장이 입력됩니다.
 */
export async function shareDelayedWaybills({
  waybills,
}: {
  waybills: OrderItem[];
}) {
  if (waybills.length == 0) {
    return "오류: 입력된 운송장이 없습니다.";
  }

  try {
    let waybillBatch = writeBatch(firestore);

    let nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = dateToDayStr(nextDay);

    for (let i = 0; i < waybills.length; i++) {
      const item = waybills[i];

      const waybillsRef = collection(firestore, `delayed-orders`);

      //기존 운송장 탐색
      const idQuery = query(
        waybillsRef,
        where("amount", "==", item.amount),
        where("customsCode", "==", item.customsCode),
        where("deliveryRequest", "==", item.deliveryRequest),
        where("managementNumber", "==", item.managementNumber),
        where("optionName", "==", item.optionName),
        where("orderNumber", "==", item.orderNumber),
        where("orderer", "==", item.orderer),
        where("ordererPhone", "==", item.ordererPhone),
        where("partnerName", "==", item.partnerName),
        where("phone", "==", item.phone),
        where("productName", "==", item.productName),
        where("receiver", "==", item.receiver),
        where("seller", "==", item.seller),
        where("zipCode", "==", item.zipCode),
        limit(1)
      );
      const querySnap = await getDocs(idQuery);

      if (querySnap.empty) {
        console.log("error: not found");
        return "오류: 수정을 요청한 운송장을 찾을 수 없습니다.";
      }

      querySnap.forEach(async (document) => {
        const docName = document.id;

        //운송장의 원 주문서가 공유된 날짜
        const orderSharedDate = document.data().orderSharedDate;

        //지연주문건에서 삭제
        waybillBatch.delete(document.ref);

        //원 주문서 수정

        let orderItemDocRef = doc(
          firestore,
          `orders/${orderSharedDate}/items`,
          docName
        );

        waybillBatch.update(orderItemDocRef, {
          shippingCompany: item.shippingCompany,
          waybillNumber: item.waybillNumber,
          waybillSharedDate: nextDayStr,
        });

        //완료운송장에 추가
        let waybillItemDocRef = doc(
          firestore,
          `waybills/${nextDayStr}/items`,
          docName
        );

        waybillBatch.set(waybillItemDocRef, {
          ...item,
          waybillSharedDate: nextDayStr,
        });
      });

      if ((i % 130 == 1 && i > 1) || i == waybills.length - 1) {
        await waybillBatch.commit();
        if (i < waybills.length - 1) {
          waybillBatch = writeBatch(firestore);
        }
      }
    }

    await setDoc(doc(firestore, `waybills/${nextDayStr}`), {
      isShared: true,
    });
    addLog("shareDelayedWaybills", { waybills: waybills.toString() });
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
 * 오늘 공유한 주문 건수를 불러옵니다.
 * @returns
 */
export async function getTodayOrdersCount() {
  const today = dateToDayStr(new Date());
  const ordersRef = collection(firestore, `orders/${today}/items`);
  const snapshot = await getCountFromServer(ordersRef);
  return snapshot.data().count;
}

/**
 * 해당 파트너가 오늘 공유받은 주문 건수를 불러옵니다.
 * @param partnerName: 파트너명
 * @returns
 */
export async function getPartnerTodayOrdersCount(partnerName: string) {
  const today = dateToDayStr(new Date());
  const ordersRef = collection(firestore, `orders/${today}/items`);
  const orderQuery = query(ordersRef, where("partnerName", "==", partnerName));
  const snapshot = await getCountFromServer(orderQuery);
  return snapshot.data().count;
}

/**
 * 이전날 공유된 (즉 오늘날로 등록된) 운송장 건수를 불러옵니다.
 * @returns
 */
export async function getTodayWaybillsCount() {
  const today = dateToDayStr(new Date());
  const waybillsRef = collection(firestore, `waybills/${today}/items`);
  const snapshot = await getCountFromServer(waybillsRef);
  return snapshot.data().count;
}

/**
 * 해당 파트너가 이전날 공유한 (즉 오늘날로 등록된) 운송장 건수를 불러옵니다.
 * @param partnerName: 파트너명
 * @returns
 */
export async function getPartnerTodayWaybillsCount(partnerName: string) {
  const today = dateToDayStr(new Date());
  const waybillsRef = collection(firestore, `waybills/${today}/items`);
  const waybillQuery = query(
    waybillsRef,
    where("partnerName", "==", partnerName)
  );
  const snapshot = await getCountFromServer(waybillQuery);
  return snapshot.data().count;
}

/**
 * 지연일자가 일정일 이상인 주문건의 개수를 불러옵니다.
 * @params day: 기준 지연일자
 * @returns
 */
export async function getDelayedOrdersCount(day: number) {
  const date = new Date();
  date.setDate(date.getDate() - day);
  const timestamp = Timestamp.fromDate(date);

  const delayedRef = collection(firestore, "delayed-orders");
  const delayQuery = query(
    delayedRef,
    where("orderTimestamp", "<=", timestamp)
  );
  const snapshot = await getCountFromServer(delayQuery);
  return snapshot.data().count;
}

/**
 * 지연일자가 일정일 이상인 주문건의 개수를 불러옵니다.
 * @params day: 기준 지연일자, partnerName: 파트너명
 * @returns
 */
export async function getPartnerDelayedOrdersCount(
  day: number,
  partnerName: string
) {
  const date = new Date();
  date.setDate(date.getDate() - day);
  const timestamp = Timestamp.fromDate(date);

  const delayedRef = collection(firestore, "delayed-orders");
  const delayQuery = query(
    delayedRef,
    where("orderTimestamp", "<=", timestamp),
    where("partnerName", "==", partnerName)
  );
  const snapshot = await getCountFromServer(delayQuery);
  return snapshot.data().count;
}

/**
 * 알림을 추가합니다
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function addNotice({
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
 * 알림을 수정합니다.
 * @param month: 월, partnerName: 파트너명, detail: 상세 내용, topic: 공유주제, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function editNotice({
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
 * 알림을 공유합니다..
 * @param month: 월, id: 해당 doc id
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function shareNotice({
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
        text: `[로파파트너] [${topic}]에 대하여 긴급알림이 있습니다. 파트너사이트의 '발신함 / 수신함'을 확인 부탁드립니다.`,
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
 * 알림들을 불러옵니다
 * @param month: 월, partnerName: 파트너명 (비어있을 경우 모든 파트너)
 * @returns
 *  List of NoticeItem
 */
export async function getNotices({
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

  const list: NoticeItem[] = [];
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
 * 공유된 알림들에 한하여 불러옵니다 (파트너 전용)
 * @param month: 월, partnerName: 파트너명
 * @returns
 *  List of NoticeItem
 */
export async function getSharedNotices({
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

  const list: NoticeItem[] = [];
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
 * 알림을 삭제합니다.
 * @param month: 월, id: 삭제할 알림 문서 아이디
 * @returns
 */
export async function deleteNotice({
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
 * 알림에 대해 답신합니다.
 * @param month: 월, id: 해당 doc id, reply: 답신
 * @returns
 * 성공하면 true 실패시 error message
 *
 */
export async function replyNotice({
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

/**
 * 상품이 DB에 등록되었는지를 확인합니다.
 * 업로드 진행 상태 데이터도 함께 지웁니다.
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

// export async function isProductUploaded({
//   productName,
// }: {
//   productName: string;
// }) {
//   try {
//     const docRef = doc(firestore, "products", productName);
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       await deleteDoc(doc(firestore, "products-progress", productName));
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error: any) {
//     return false;
//   }
// }

/**
 * 이미지 업로드 진행 상태를 받아옵니다.
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

export async function getProductUploadProgress({
  productName,
}: {
  productName: string;
}) {
  try {
    const docRef = doc(firestore, "products-progress", productName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let total: number = data.mainTotalBytes + data.thumbnailTotalBytes;
      let transferred: number =
        data.mainBytesTransferred + data.thumbnailBytesTransferred;
      for (let i = 0; i < data.detailLength; i++) {
        total += data[`detailTotalBytes_${i}`];
        transferred += data[`detailBytesTransferred_${i}`];
      }
      for (let i = 0; i < data.extraLength; i++) {
        total += data[`extraTotalBytes_${i}`];
        transferred += data[`extraBytesTransferred_${i}`];
      }
      const progress = (transferred / total) * 100;
      return progress;
    } else {
      return 0;
    }
  } catch (error: any) {
    console.log("ERROR", error);
    return 0;
  }
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

/**
 * @param id: productName (해당 상품 이름)
 * @returns boolean
 */

// export async function isProductImageUploadFinished({
//   productName,
// }: {
//   productName: string;
// }) {
//   try {
//     const docRef = doc(firestore, "products-progress", productName);
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       const detailURLList = [];
//       const detailNameList = [];
//       const extraURLList = [];
//       const extraNameList = [];
//       if (!data.mainURL) return false;
//       if (!data.thumbnailURL) return false;
//       for (let i = 0; i < data.detailLength; i++) {
//         if (!data[`detailURL_${i}`]) return false;
//         detailURLList.push(data[`detailURL_${i}`]);
//         detailNameList.push(data[`detailName_${i}`]);
//       }
//       for (let i = 0; i < data.extraLength; i++) {
//         if (!data[`extraURL_${i}`]) return false;
//         extraURLList.push(data[`extraURL_${i}`]);
//         extraNameList.push(data[`extraName_${i}`]);
//       }

//       await updateDoc(doc(firestore, "products", productName), {
//         mainImageURL: data.mainURL,
//         mainImageName: data.mainName,
//         thumbnailImageURL: data.thumbnailURL,
//         thumbnailImageName: data.thumbnailName,
//         detailImageURLList: detailURLList,
//         detailImageNameList: detailNameList,
//         extraImageURLList: extraURLList,
//         extraImageNameList: extraNameList,
//       });

//       await deleteDoc(doc(firestore, "products-progress", productName));

//       return true;
//     } else {
//       return false;
//     }
//   } catch (error: any) {
//     return false;
//   }
// }

export async function sendSettlementNoticeEmail({
  partnerList,
}: {
  partnerList: string[];
}) {
  const profilesMap = await getAllPartnerProfiles();
  let countForRateLimit = 0;
  let successCount = 0;
  let start = performance.now();
  for (let i = 0; i < partnerList.length; i++) {
    countForRateLimit++;
    if (countForRateLimit >= 10) {
      countForRateLimit = 0;
      const end = performance.now();
      const spentTime = end - start;
      if (spentTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - spentTime));
        console.log(`At index i, Waited for ${1000 - spentTime} milisecond`);
      } else {
        console.log(`At index i, spent time is ${spentTime}`);
      }
      start = performance.now();
    }
    const partnerName = partnerList[i];
    const partnerProfile = profilesMap.get(partnerName);
    if (partnerProfile) {
      const email = partnerProfile.email;
      if (email && email.length > 0) {
        const html = `<div><div dir="ltr">안녕하세요.<br>로파서울 입니다.<br>전월 정산내역이 있어 안내드립니다.<br><br><span style="background-color:rgb(255,255,255)"><font size="4"><b style="">[정산내역 확인 후 계산서 발급]</b></font></span><div><span style="background-color:rgb(255,255,0)"><b style="">로파서울 파트너 사이트</b><br></span><div dir="ltr"><span style="background-color:rgb(255,255,0)"><b style=""><a href="https://lofaseoul-partner.netlify.app/login" target="_blank" style="" rel="noreferrer noopener">https://lofaseoul-partner.netlify.app/login</a></b><br></span><br><b style="background-color:rgb(255,255,255)">로파서울 파트너사이트의 정산 조회로 들어가셔서<br>전월의 정산금액과 배송비가 합산된 '최종 정산금액'만큼을 세금계산서 또는 현금영수증 발행 부탁드립니다.&nbsp;<br>본 정산 안내메일 발송일의 전월(판매가 이루어진 달)을 선택 해주셔야 합니다.</b></div><div dir="ltr"><b style=""><br></b><b><font color="#ff0000">* 세금계산서(일반과세자) 또는 현금영수증(간이과세자)이 발행되지 않으면 정산이 이루어지지 않으니, 반드시 말일 전까지 발행 부탁드립니다.&nbsp;</font></b><br><div><b style="background-color:rgb(255,255,0)"><br></b></div><div><b style="background-color:rgb(255,255,0)">비사업자 파트너 분들은 아래 링크를 통해 세금신고를 위한 정보를 기입 부탁드립니다.<br><a href="https://azttw5wwaus.typeform.com/to/leso5NDJ" target="_blank" style="" rel="noreferrer noopener">https://azttw5wwaus.typeform.com/to/leso5NDJ</a></b></div><div><b style=""><br><span style="background-color:rgb(255,255,255)">[정산관련 추가안내]</span></b></div><div>전월의 1일 - 말일 동안의 구매건 중<br>'배송 완료&nbsp;+ 구매자 승인'까지 <b>정상처리가 완료된 내역만 포함</b>됩니다.&nbsp;<br>(월말 주문건들은 포함되지 않을 수 있으며, 정상처리되면 다음달 정산내역에 포함됩니다.)<b style="background-color:rgb(255,255,0)"><br></b><br><b>매월 1일에 전월의 정산내역이 공유</b>되며,<br>세금계산서 및 현금영수증 발행이 확인되면 <b>말일에 이체가 진행</b>됩니다.<br>(말일이 공휴일이면 다음 영업일에 진행됩니다.)<br>말일에 지출증빙이 확인되지 않으면, 안내 메일이 전송되고 <b>10/20일 중간정산일에 정산지연건이 처리</b>됩니다.</div><div><br>파트너사이트를 통해 <b>첫 정산이신 파트너</b>분들은<br><b style="background-color:rgb(255,255,0)">손영준 매니저(<a href="mailto:syj@tabacprss.xyz" rel="noreferrer noopener" target="_blank">syj@tabacprss.xyz</a>)</b>에게 파트너 사이트 로그인 정보 및<br>사업자 등록증을 요청 부탁드립니다.<br><br>긴 글 읽어주시고, 정산과정에 협조 해주셔서 감사합니다.<br><br>로파서울 드림</div></div></div></div></div>`;
        const result = await sendResendEmail({
          to: email,
          subject: `[로파서울] ${partnerName} 정산안내 및 증빙 요청`,
          html: html,
        });
        successCount++;
        if (result.error) {
          return {
            status: "error",
            message: result.error.message,
            partnerName: partnerName,
          };
        }
      }
    } else {
      return {
        status: "error",
        message: `partner profile '${partnerName}' not found`,
        partnerName: partnerName,
      };
    }
  }
  addLog("sendSettlementNoticeEmail", { partnerList: partnerList });
  return {
    status: "ok",
    message: `파트너 ${successCount}곳에 메일이 전송되었습니다. (메일이 누락된 경우 제외 처리)`,
  };
}

/**
 * 수익통계자료를 업로드합니다.
 * @param settlements: JSON string of settlement items list
 * @returns
 *
 */
export async function addRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();
    await setDoc(doc(firestore, `revenue-data-add/data`), {
      json: data,
      updateTime: time,
    });

    addLog("addRevenueData", {
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

/**
 * 조건을 만족하는 수익통계 데이터를 불러옵니다
 * @param partnerName: 파트너명, monthStr: 월
 * @returns
 *  Array of RevenueData
 */
export async function getRevenueData({
  startDate,
  endDate,
  partnerName,
  productName,
  seller,
  orderStatus,
  cs,
  filterDiscount,
  productCategory,
}: {
  startDate: Date;
  endDate: Date;
  partnerName: string;
  productName: string;
  seller: string;
  orderStatus: string;
  cs: string;
  filterDiscount: string;
  productCategory: string[];
}) {
  console.log(startDate, endDate);
  let orderStatusQueryArray: string[];
  switch (orderStatus) {
    case "전체":
      orderStatusQueryArray = PossibleOrderStatus;
      break;
    case "접수+송장":
      orderStatusQueryArray = ["접수", "송장"];
      break;
    case "접수+배송":
      orderStatusQueryArray = ["접수", "배송"];
      break;
    case "송장+배송":
      orderStatusQueryArray = ["송장", "배송"];
      break;
    default:
      orderStatusQueryArray = [orderStatus];
      break;
  }

  let csQueryArray: string[];

  switch (cs) {
    case "전체":
      csQueryArray = PossibleCS;
      break;
    case "정상":
      csQueryArray = ["정상"];
      break;
    case "정상+교환":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
      ];
      break;
    case "취소(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 취소",
        "배송전 전체 취소",
        "배송후 부분 취소",
        "배송후 전체 취소",
      ];
      break;
    case "교환(배송전+배송후)":
      csQueryArray = [
        "배송전 부분 교환",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 교환",
        "맞교환",
        "배송후교환C",
      ];
      break;
    case "배송전 취소":
      csQueryArray = ["배송전 부분 취소", "배송전 전체 취소"];
      break;
    case "배송후 취소":
      csQueryArray = ["배송후 부분 취소", "배송후 전체 취소"];
      break;
    case "배송전 교환":
      csQueryArray = ["배송전 부분 교환", "배송전 전체 교환"];
      break;
    case "배송후 교환":
      csQueryArray = ["배송후 부분 교환", "배송후 전체 교환", "배송후교환C"];
      break;
    case "보류":
    case "맞교환":
    case "배송후교환C":
      csQueryArray = [cs];
      break;
    case "부분취소":
      csQueryArray = ["배송전 부분 취소", "배송후 부분 취소"];
      break;
    case "부분취소 제외":
      csQueryArray = [
        "정상",
        "배송전 부분 교환",
        "배송전 전체 취소",
        "배송전 전체 교환",
        "배송후 부분 교환",
        "배송후 전체 취소",
        "배송후 전체 교환",
        "보류",
        "맞교환",
        "배송후교환C",
      ];
      break;
    default:
      csQueryArray = [cs];
      break;
  }

  let filterDiscountQueryArray: boolean[] = [];
  switch (filterDiscount) {
    case "전체":
      filterDiscountQueryArray = [true, false];
      break;
    case "할인 있음":
      filterDiscountQueryArray = [true];
      break;
    case "할인 없음":
      filterDiscountQueryArray = [false];
      break;
  }

  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate)),
    where("orderStatus", "in", orderStatusQueryArray), // Max 3
    //where("cs", "in", csQueryArray), //Max 12, 사용 불가, 불러온 후 직접 필터해서 확인
    where("isDiscounted", "in", filterDiscountQueryArray) //Max 2
  );

  if (partnerName.length > 0) {
    revenueDataQuery = query(
      revenueDataQuery,
      where("partnerName", "==", partnerName)
    );
  }

  if (seller !== "all") {
    revenueDataQuery = query(revenueDataQuery, where("seller", "==", seller));
  }

  const partnerProfiles = await getAllPartnerProfiles(true);

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult: { data: DocumentData; id: string }[] = [];
  querySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (
      data.productName.includes(productName) &&
      csQueryArray.includes(data.cs)
    ) {
      //상품분류 검색한게 없으면 따로 검사 안함
      if (productCategory.length == 0) {
        data.orderDate = data.orderDate.toDate();
        searchResult.push({ data: data, id: doc.id });
      } else {
        //상품분류 검색이 있는데, 데이터의 상품분류 항목이 없으면 포함X
        const partnerProfile = partnerProfiles.get(data.partnerName);
        const productCategories = partnerProfile.productCategory;
        if (productCategories) {
          for (let i = 0; i < productCategory.length; i++) {
            if (productCategories.includes(productCategory[i])) {
              data.orderDate = data.orderDate.toDate();
              searchResult.push({ data: data, id: doc.id });
              break;
            }
          }
        }
      }
    }
  });
  return searchResult;
}

/**
 * 수익통계자료를 삭제합니다.
 * @param JSON string of {data: RevenueData, id: string}[]
 *
 */
export async function deleteRevenueData({ data }: { data: string }) {
  try {
    const time = new Date().getTime();

    await setDoc(doc(firestore, `revenue-data-delete/data`), {
      json: data,
      updateTime: time,
    });

    addLog("deleteRevenueData", {
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

export async function getRevenueStats({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const partnerProfiles = await getAllPartnerProfiles(true);
  const revenueDataRef = collection(firestore, `revenue-db`);
  let revenueDataQuery = query(
    revenueDataRef,
    where("orderDate", ">=", Timestamp.fromDate(startDate)),
    where("orderDate", "<=", Timestamp.fromDate(endDate))
  );

  const querySnap = await getDocs(revenueDataQuery);
  const searchResult = new Map<string, PartnerRevenueStat>();

  try {
    querySnap.docs.forEach((doc) => {
      const data = doc.data() as RevenueData;
      const isLofa = LofaSellers.includes(data.seller);
      const isCsOK = data.cs == "정상";
      const isOrderStatusDeliver = data.orderStatus == "배송";

      const partnerProfile: PartnerProfile = partnerProfiles.get(
        data.partnerName
      );

      if (!searchResult.has(data.partnerName)) {
        let partnerStat: PartnerRevenueStat = {
          startDateStr: dateToDayStr(startDate),
          endDateStr: dateToDayStr(endDate),
          partnerName: data.partnerName,
          lofaSalesAmount: 0,
          otherSalesAmount: 0,
          totalSalesAmount: 0,
          partnerSettlement: 0,
          platformFee: 0,
          lofaDiscountLevy: 0,
          proceeds: 0,
          netProfitAfterTax: 0,
          returnRate: 0,
          productCategory: [], //TODO: add product category
        };

        searchResult.set(data.partnerName, partnerStat);
      }

      let lofaSalesAmount;
      let otherSalesAmount;
      let totalSalesAmount;
      let partnerSettlement;
      let platformFee;
      let lofaDiscountLevy;
      let proceeds;
      let netProfitAfterTax;

      let platformSettlement;

      if (!data.isDiscounted) {
        lofaSalesAmount =
          isCsOK && isLofa && isOrderStatusDeliver
            ? data.price * data.amount
            : 0;
        otherSalesAmount =
          isCsOK && !isLofa && isOrderStatusDeliver
            ? data.price * data.amount
            : 0;
        totalSalesAmount = lofaSalesAmount + otherSalesAmount;
        partnerSettlement =
          (totalSalesAmount * (100 - (data.commonFeeRate ?? NaN))) / 100;
        platformSettlement = isLofa
          ? totalSalesAmount
          : (totalSalesAmount * (100 - (data.platformFeeRate ?? NaN))) / 100; //플랫폼정산금
        platformFee = totalSalesAmount - platformSettlement;
        lofaDiscountLevy = 0;
        if (!isCsOK || !isOrderStatusDeliver) {
          netProfitAfterTax = 0;
        }
      } else {
        //TODO
        if (
          data.lofaDiscountLevyRate == undefined ||
          data.partnerDiscountLevyRate == undefined ||
          data.platformDiscountLevyRate == undefined ||
          data.lofaAdjustmentFeeRate == undefined ||
          data.platformAdjustmentFeeRate == undefined
        ) {
          throw Error(
            `해당 상품의 할인내역을 불러오는 과정에서 문제가 발생했습니다. (${data.productName})`
          );
        }
        const totalDiscountRate =
          data.lofaDiscountLevyRate +
          data.partnerDiscountLevyRate +
          data.platformDiscountLevyRate;
        lofaSalesAmount =
          isCsOK && isLofa && isOrderStatusDeliver
            ? ((data.price * (100 - totalDiscountRate)) / 100.0) * data.amount
            : 0;
        otherSalesAmount =
          isCsOK && !isLofa && isOrderStatusDeliver
            ? ((data.price * (100 - totalDiscountRate)) / 100.0) * data.amount
            : 0;
        totalSalesAmount = lofaSalesAmount + otherSalesAmount;
        const normalPriceTotalSalesAmount = data.price * data.amount;
        partnerSettlement =
          (normalPriceTotalSalesAmount *
            (100 -
              (data.commonFeeRate ?? NaN) -
              data.partnerDiscountLevyRate +
              data.lofaAdjustmentFeeRate)) /
          100;
        const platformSettlementStandard: "정상판매가" | "할인판매가" =
          NormalPriceStandardSellers.includes(data.seller)
            ? "정상판매가"
            : "할인판매가";
        platformSettlement = isLofa
          ? totalSalesAmount
          : platformSettlementStandard == "정상판매가"
          ? (normalPriceTotalSalesAmount *
              (100 -
                (data.platformFeeRate ?? NaN) -
                data.lofaDiscountLevyRate -
                data.partnerDiscountLevyRate +
                data.platformAdjustmentFeeRate)) /
            100
          : (((normalPriceTotalSalesAmount *
              (100 -
                data.lofaDiscountLevyRate -
                data.partnerDiscountLevyRate)) /
              100) *
              (100 -
                (data.platformFeeRate ?? NaN) +
                data.platformAdjustmentFeeRate)) /
            100; //플랫폼정산금
        platformFee = totalSalesAmount - platformSettlement;
        lofaDiscountLevy =
          (normalPriceTotalSalesAmount * data.lofaDiscountLevyRate) / 100;
      }

      proceeds = totalSalesAmount - partnerSettlement - platformFee;
      switch (data.businessTaxStandard) {
        case "일반":
          netProfitAfterTax = proceeds * 0.9;
          break;
        case "간이":
        case "비사업자":
          netProfitAfterTax = platformSettlement * 0.9 - partnerSettlement;
          break;
        case "면세":
        default:
          netProfitAfterTax = proceeds;
          break;
      }

      const stat = searchResult.get(data.partnerName) as PartnerRevenueStat;
      stat.lofaSalesAmount += lofaSalesAmount;
      stat.otherSalesAmount += otherSalesAmount;
      stat.totalSalesAmount += totalSalesAmount;
      stat.partnerSettlement += partnerSettlement;
      stat.platformFee += platformFee;
      stat.lofaDiscountLevy += lofaDiscountLevy;
      stat.proceeds += proceeds;
      stat.netProfitAfterTax += netProfitAfterTax;
      if (partnerProfile) {
        stat.productCategory = partnerProfile.productCategory ?? [];
      } else {
        stat.productCategory = [];
      }
    });
  } catch (error: any) {
    return error.message as string;
  }

  searchResult.forEach((stat: PartnerRevenueStat) => {
    if (stat.totalSalesAmount != 0) {
      stat.returnRate = (stat.netProfitAfterTax / stat.totalSalesAmount) * 100;
    } else {
      stat.returnRate = 0;
    }
  });

  return Array.from(searchResult.values());
}

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
  partnerName,
  productName,
}: {
  startDate: Date;
  endDate: Date;
  partnerName: string;
  productName: string;
}) {
  //OR Query 한도때문에 query array의 길이의 곱이 30을 넘을 수 없음
  const discountDataRef = collection(firestore, `discount-db`);
  let discountDataQuery = query(
    discountDataRef,
    and(
      where("startDate", "<=", Timestamp.fromDate(endDate)),
      where("endDate", ">=", Timestamp.fromDate(startDate))
    )
  );

  if (partnerName.length > 0) {
    discountDataQuery = query(
      discountDataQuery,
      where("partnerName", "==", partnerName)
    );
  }

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

export async function addLog(functionName: string, data: DocumentData) {
  const timestamp = Timestamp.fromDate(new Date());
  const id = getIdFromTime();
  await setDoc(doc(firestore, `log`, id), {
    logTime: timestamp,
    functionName: functionName,
    ...data,
  });
}
