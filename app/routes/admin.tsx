import { Outlet, useSubmit, useTransition } from "@remix-run/react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import styled from "styled-components";
import { AdminHeader } from "~/components/header";
import { AdminSidebar } from "~/components/sidebar";
import { LoadingOverlay } from "@mantine/core";
import { isCurrentUserAdmin, logout } from "~/services/auth.server";

const AdminPage = styled.div`
  width: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 33px;
  text-align: center;
  font-weight: 700;
  line-height: 1;
`;

/**
 *  handle the logout request
 *
 * @param param0
 */
export const action: ActionFunction = async ({ request }) => {
  await logout();
  return redirect("/login");
};

/**
 * check the user to see if there is an active session, if not
 * redirect to login page
 * if user is not admin, redirect to partner page
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  const userAdmin = await isCurrentUserAdmin(); //로그인 안됐을 경우 null, 했을 경우 admin 여부
  if (userAdmin !== null) {
    if (!userAdmin) {
      return redirect("/partner/dashboard");
    } else {
      return null;
    }
  } else {
    return redirect("/login");
  }
};

export default function Admin() {
  const submit = useSubmit();
  const transition = useTransition();

  return (
    <>
      <LoadingOverlay
        visible={
          transition.state == "loading" || transition.state == "submitting"
        }
        overlayBlur={2}
      />
      <AdminPage>
        <AdminHeader
          onLogoutClick={() => {
            submit(null, { method: "post" });
          }}
        />
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
          }}
        >
          <AdminSidebar />
          <Outlet />
        </div>
      </AdminPage>
    </>
  );
}
