import {
  Outlet,
  useLoaderData,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import authenticator from "~/services/auth.server";
import styled from "styled-components";
import { PartnerHeader } from "~/components/header";
import { PartnerSidebar } from "~/components/sidebar";
import { LoadingOverlay } from "@mantine/core";

const PartnerPage = styled.div`
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
 * if user is admin, redirect to admin page
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  let user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (user !== null && "isAdmin" in user) {
    if (user.isAdmin) {
      return redirect("/admin/dashboard");
    }
  }
  return user;
};

export default function Partner() {
  const userData = useLoaderData();
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
      <PartnerPage>
        <PartnerHeader
          username={userData.name}
          onLogoutClick={() => submit(null, { method: "post" })}
        />
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
          }}
        >
          <PartnerSidebar />
          <Outlet />
        </div>
      </PartnerPage>
    </>
  );
}
