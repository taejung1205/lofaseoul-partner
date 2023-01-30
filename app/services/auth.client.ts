import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { idToEmail } from "~/utils/account";

export async function getSignInToken(
  id: string,
  password: string,
  firebaseConfig: any
) {
  try {
    initializeApp(firebaseConfig);
    const auth = getAuth();

    // sign in
    const { user } = await signInWithEmailAndPassword(
      auth,
      idToEmail(id),
      password
    );
    const idToken = await user.getIdToken();
    const email = user.email;
    const uid = user.uid;

    await signOut(auth);

    return { result: "success", idToken: idToken, email: email, uid: uid };
  } catch (error: any) {
    // prepare the errors for display
    const errorCode: string = error.code;
    const errorMessage: string = error.message;
    return { result: "fail", errorCode: errorCode, errorMessage: errorMessage };
  }
}
