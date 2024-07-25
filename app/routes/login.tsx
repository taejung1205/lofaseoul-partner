import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { HeaderBox, MobileHeaderBox } from "~/components/header";
import { LoadingOverlay } from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import { getSignInToken } from "~/services/auth.client";
import { getFirebaseConfig, isAdmin } from "~/services/firebase.server";
import { createUserSession, User } from "~/services/session.server";
import { isMobile } from "~/utils/mobile";
import { useViewportSize } from "@mantine/hooks";

interface LoginPageProps extends React.HTMLProps<HTMLDivElement> {
  isMobile: boolean;
}

export function LoginPage({ isMobile, ...props }: LoginPageProps) {
  const styles: React.CSSProperties = {
    width: "inherit",
    fontSize: isMobile ? "20px" : "33px",
    textAlign: "center",
    fontWeight: 700,
    lineHeight: 1,
  };

  return <div style={styles} {...props} />;
}

interface InputBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isMobile: boolean;
}

export function InputBox({ isMobile, ...props }: InputBoxProps) {
  const styles: React.CSSProperties = {
    width: isMobile ? "70%" : "730px",
    display: "flex",
    height: isMobile ? "40px" : "75px",
    border: "3px solid black",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: isMobile ? "12px" : "27px",
    paddingTop: "12px",
    paddingBottom: "12px",
    textAlign: "left",
    fontSize: isMobile ? "20px" : "35px",
  };

  return <input style={styles} {...props} />;
}

export function LoginButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const styles: React.CSSProperties = {
    width: "266px",
    height: "60px",
    backgroundColor: "black",
    color: "white",
    fontWeight: 700,
    fontSize: "33px",
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
}

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

  const navigation = useNavigation();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  async function handleLogin() {
    if (id.length == 0 || password.length == 0) {
      setErrorMessage("아이디와 패스워드를 입력하세요.");
      return false;
    }
    const resp = await getSignInToken(id, password, loaderData.firebaseConfig);
    if (resp.result == "success") {
      const formData = new FormData(formRef.current ?? undefined);
      formData.set("idToken", resp.idToken ?? "");
      formData.set("uid", resp.uid ?? "");
      formData.set("email", resp.email ?? "");
      submit(formData, { method: "post" });
      return false;
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
      return false;
    }
  }

  return (
    <>
      <LoadingOverlay
        visible={
          navigation.state == "loading" || navigation.state == "submitting"
        }
        overlayBlur={2}
      />
      <LoginPage isMobile={isMobileMemo}>
        {isMobileMemo ? <MobileHeaderBox /> : <HeaderBox />}
        <div style={{ height: isMobileMemo ? "50px" : "100px" }} />
        로파 서울 파트너사이트입니다.
        <div style={{ height: isMobileMemo ? "50px" : "150px" }} />
        <Form onSubmit={handleLogin}>
          <InputBox
            type="string"
            placeholder="ID"
            required
            value={id}
            onChange={(event) => setId(event.target.value)}
            isMobile={isMobileMemo}
          />
          <div style={{ height: isMobileMemo ? "20px" : "40px" }} />
          <InputBox
            type="password"
            placeholder="PW"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            isMobile={isMobileMemo}
          />
          <div style={{ height: "100px" }} />
          <LoginButton type="submit">로그인</LoginButton>
        </Form>
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
