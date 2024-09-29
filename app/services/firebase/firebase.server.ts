// Import the functions you need from the SDKs you need
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { PartnerProfile } from "~/components/partner_profile";
import {
  createAuthAccount,
  deleteAuthAccount,
  updateAuthAccount,
} from "./firebaseAdmin.server";
import { emailToId } from "~/utils/account";
import { getIdFromTime } from "~/components/date";
import { firestore } from "./firebaseInit.server";

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
    gwangjuBiennaleFee: partnerProfile.gwangjuBiennaleFee, 
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

export async function addLog(functionName: string, data: DocumentData) {
  const timestamp = Timestamp.fromDate(new Date());
  const id = getIdFromTime();
  await setDoc(doc(firestore, `log`, id), {
    logTime: timestamp,
    functionName: functionName,
    ...data,
  });
}
