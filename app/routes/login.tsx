import {
  useActionData,
  useLoaderData,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import styled from "styled-components";
import { HeaderBox } from "~/components/header";
import { LoadingOverlay } from "@mantine/core";
import { useRef, useState } from "react";
import { getSignInToken } from "~/services/auth.client";
import { getFirebaseConfig, isAdmin } from "~/services/firebase.server";
import { createUserSession, User } from "~/services/session.server";
import { dateToDayStr } from "~/components/date";

const LoginPage = styled.div`
  width: inherit;
  font-size: 33px;
  text-align: center;
  font-weight: 700;
  line-height: 1;
`;

const InputBox = styled.input`
  width: 730px;
  height: 75px;
  border: 3px solid black;
  margin-left: auto;
  margin-right: auto;
  padding-left: 27px;
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  font-size: 35px;
  ::placeholder {
    color: black;
    font-weight: 700;
    opacity: 1;
  }
  :focus::placeholder {
    color: transparent;
  }
`;

const LoginButton = styled.button`
  width: 266px;
  height: 60px;
  background-color: black;
  color: white;
  font-weight: 700;
  font-size: 33px;
  cursor: pointer;
`;

/**
 * 로그인
 */
export const action: ActionFunction = async ({ request, context }) => {
  try {
    const body = await request.formData();
    const idToken: string = body.get("idToken")?.toString()!;
    const uid: string = body.get("uid")?.toString()!;
    const email: string = body.get("email")?.toString()!;

    const admin = await isAdmin(email);

    const user: User = {
      idToken: idToken,
      email: email,
      uid: uid,
      isAdmin: admin,
    };

    return createUserSession({ user: user, isRedirect: true });
  } catch (error: any) {
    return json({
      result: "fail",
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const firebaseConfig = getFirebaseConfig();
  return json({ firebaseConfig: firebaseConfig });
};

/**
 *
 * @returns
 */
export default function Login() {
  // if i got an error it will come back with the loader data

  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const transition = useTransition();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleLogin() {
    if (id.length == 0 || password.length == 0) {
      setErrorMessage("아이디와 패스워드를 입력하세요.");
      return null;
    }
    const resp = await getSignInToken(id, password, loaderData.firebaseConfig);
    if (resp.result == "success") {
      const formData = new FormData(formRef.current ?? undefined);
      formData.set("idToken", resp.idToken ?? "");
      formData.set("uid", resp.uid ?? "");
      formData.set("email", resp.email ?? "");
      submit(formData, { method: "post" });
    } else {
      switch (resp.errorCode) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setErrorMessage("아이디와 비밀번호를 확인해주세요.");
          break;
        case "auth/too-many-requests":
          setErrorMessage(
            "로그인 시도 가능 횟수가 초과하였습니다. 관리자에게 문의해주세요."
          );
          break;
        default:
          setErrorMessage(`로그인 중 오류가 발생했습니다. ${resp.errorCode}`);
          break;
      }
      return null;
    }
  }

  return (
    <>
      <LoadingOverlay
        visible={
          transition.state == "loading" || transition.state == "submitting"
        }
        overlayBlur={2}
      />
      <LoginPage>
        <HeaderBox />
        <div style={{ height: "100px" }} />
        로파 서울 파트너사이트입니다.
        <div style={{ height: "150px" }} />
        <InputBox
          type="string"
          name="id"
          placeholder="ID"
          required
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
        <div style={{ height: "40px" }} />
        <InputBox
          type="password"
          name="password"
          placeholder="PW"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div style={{ height: "100px" }} />
        <LoginButton onClick={handleLogin}>로그인</LoginButton>
        <div>
          {actionData?.errorCode ? (
            <p>Login Failed: {actionData?.errorMessage}</p>
          ) : (
            <></>
          )}
          <p>{errorMessage}</p>
        </div>
      </LoginPage>
    </>
  );
}
