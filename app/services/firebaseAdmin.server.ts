import { ServiceAccount } from "firebase-admin";
import { App, initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { idToEmail } from "~/utils/account";

let app: App;
let auth: Auth;

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
  auth = getAuth(app);
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };

/**
 * 새로운 파트너 로그인 계정을 추가합니다
 * @param id: 아이디, password: 비밀번호, name: 파트너명
 */
export async function createAuthAccount(
  id: string,
  password: string,
  name: string
) {
  const email = idToEmail(id);
  return auth.createUser({
    email: email,
    password: password,
    displayName: name,
    uid: name
  }).catch((error) => {
    console.log(error.code);
    return error.message;
  });
}

/**
 * 기존 파트너 로그인 계정 정보를 수정합니다.
 * @param name: 파트너명(=uid), id: 아이디, password: 비밀번호
 */
export async function updateAuthAccount(
  name: string,
  id: string,
  password: string
) {
  const email = idToEmail(id);
  return auth.updateUser(name, {
    email: email,
    password: password,
  }).catch((error) => {
    console.log(error.code);
    //TODO: code에 맞는 메세지 반환
    return error.message;
  });;
}

/**
 * 기존 파트너 로그인 계정 정보를 삭제합니다.
 * @param  name: 파트너명 (= uid)
 */
export async function deleteAuthAccount(name: string) {
  return auth.deleteUser(name);
}
