import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { emailToId, idToEmail } from "~/utils/account";
import { isAdmin } from "./firebase.server";

const auth = getAuth();
const user = auth.currentUser;

export function createUser(id: string, password: string) {
  const email = idToEmail(id);
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });
}

export async function login(id: string | undefined, password: string | undefined) {
  if(id == undefined){
    return "아이디를 입력해주세요."
  }

  if(password == undefined){
    return "비밀번호를 입력해주세요."
  }

  const email = idToEmail(id);
  const result = await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      return user;
    })
    .catch((error) => {
      const errorCode: string = error.code;
      const errorMessage: string = error.message;
      return errorMessage;
    });
  return result;
}

export async function logout() {
  const result = signOut(auth)
    .then(() => {
      // Sign-out successful.
      return "ok";
    })
    .catch((error) => {
      // An error happened.
      const errorMessage: string = error.message;
      return errorMessage;
    });
}

export async function getCurrentUser() {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    // ...
    return user.email;
  } else {
    // No user is signed in.
    return null;
  }
}

/**
 * 로그인이 되지 않았을 경우 null return
 * 로그인이 됐을 경우, admin이면 true, 아니면 false
 */
export async function isCurrentUserAdmin(){
  if (user) {
    const email = user.email;
    if(email !== null){
      const id = emailToId(email);
      const admin = await isAdmin(id);
      return admin;
    } else  {
      return null;
    }
  } else {
    // No user is signed in.
    return null;
  }
}
