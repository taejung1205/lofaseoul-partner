import { Outlet, useSubmit, useTransition } from "@remix-run/react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import authenticator from "~/services/auth.server";
import styled from "styled-components";
import { AdminHeader } from "~/components/header";
import { AdminSidebar } from "~/components/sidebar";
import { LoadingOverlay } from "@mantine/core";

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
  await authenticator.logout(request, { redirectTo: "/login" });
};

/**
 * check the user to see if there is an active session, if not
 * redirect to login page
 * if user is not admin, redirect to partner page
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  let user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (user !== null && "isAdmin" in user) {
    if (!user.isAdmin) {
      return redirect("/partner/dashboard");
    }
  }
  return user;
};

export default function Admin() {
  const submit = useSubmit();
  const transition = useTransition();

  return (
    <>
      <LoadingOverlay visible={transition.state == "loading" || transition.state == "submitting"} overlayBlur={2} />
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
