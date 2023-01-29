import { Form, useActionData, useTransition } from "@remix-run/react";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import styled from "styled-components";
import { HeaderBox } from "~/components/header";
import { LoadingOverlay } from "@mantine/core";
import { isCurrentUserAdmin, login } from "~/services/auth.server";

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
  const body = await request.formData();
  const id = body.get("id")?.toString();
  const password = body.get("password")?.toString();

  let resp = await login(id, password);

  if (typeof resp == "string") {
    //TODO: 로그인 에러
    console.log(resp);
    return json({ error: resp });
  } else {
    const isAdmin = await isCurrentUserAdmin();
    if (isAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return redirect("/partner/dashboard");
    }
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const userAdmin = await isCurrentUserAdmin(); //로그인 안됐을 경우 null, 했을 경우 admin 여부
  if (userAdmin !== null) {
    if (userAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return redirect("/partner/dashboard");
    }
  } else {
    return null;
  }
};

/**
 *
 * @returns
 */
export default function Login() {
  // if i got an error it will come back with the loader data
  const actionData = useActionData();
  const transition = useTransition();

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
        <Form method="post">
          <InputBox type="string" name="id" placeholder="ID" required />
          <div style={{ height: "40px" }} />
          <InputBox
            type="password"
            name="password"
            placeholder="PW"
            autoComplete="current-password"
          />
          <div style={{ height: "100px" }} />
          <LoginButton>로그인</LoginButton>
        </Form>
        <div>{actionData?.error ? <p>{actionData?.error}</p> : <></>}</div>
      </LoginPage>
    </>
  );
}
