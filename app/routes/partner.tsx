import { Form, Outlet, useLoaderData } from "@remix-run/react";
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import authenticator from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import styled from "styled-components";
import { AdminHeader, PartnerHeader } from "~/components/header";
import { AdminSidebar, PartnerSidebar } from "~/components/sidebar";

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
      return redirect("/partner/dashboard");
    }
  }
  return user;
};

export default function Partner() {
  const userData = useLoaderData();

  return (
    <PartnerPage>
      <PartnerHeader username={userData.name} />
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
  );
}
