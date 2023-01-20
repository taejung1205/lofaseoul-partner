import { Form, useLoaderData, useTransition } from "@remix-run/react";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import authenticator from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import styled from "styled-components";
import { HeaderBox } from "~/components/header";
import { LoadingOverlay } from "@mantine/core";

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
 * called when the user hits button to login
 *
 * @param param0
 * @returns
 */
export const action: ActionFunction = async ({ request, context }) => {
  // call my authenticator
  let resp = await authenticator.authenticate("form", request, {
    successRedirect: "/",
    failureRedirect: "/login",
    throwOnError: true,
    context,
  });
  if (resp !== null && "isAdmin" in resp) {
    if (resp.isAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return redirect("/");
    }
  }
  console.log(resp);
  return resp;
};

/**
 * get the cookie and see if there are any errors that were
 * generated when attempting to login
 *
 * @param param0
 * @returns
 */
export const loader: LoaderFunction = async ({ request }) => {
  let user = await authenticator.isAuthenticated(request);
  if (user !== null && "isAdmin" in user) {
    if (user.isAdmin) {
      console.log(user);
      return redirect("/admin/dashboard");
    } else {
      return redirect("/");
    }
  }

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const error = session.get("sessionErrorKey");
  return json<any>({ error });
};

/**
 *
 * @returns
 */
export default function Login() {
  // if i got an error it will come back with the loader data
  const loaderData = useLoaderData();
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
        <div>
          {loaderData?.error ? (
            <p>ERROR: {loaderData?.error?.message}</p>
          ) : null}
        </div>
      </LoginPage>
    </>
  );
}
