import { Outlet, useSubmit, useTransition } from "@remix-run/react";
import { LoaderFunction, redirect } from "@remix-run/node";
import styled from "styled-components";
import { AdminHeader } from "~/components/header";
import { AdminSidebar } from "~/components/sidebar";
import { LoadingOverlay } from "@mantine/core";
import { requireUser } from "~/services/session.server";

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
 * check the user to see if there is an active session, if not
 * redirect to login page
 * if user is not admin, redirect to partner page
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/login");
  }

  if (!user.isAdmin) {
    return redirect("/partner/dashboard");
  }

  return null;
};

export default function Admin() {
  const transition = useTransition();
  const submit = useSubmit();

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
            submit(null, { method: "post", action: "/logout" });
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
