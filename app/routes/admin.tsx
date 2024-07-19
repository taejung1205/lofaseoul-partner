import { Outlet, useSubmit } from "@remix-run/react";
import { LoaderFunction, redirect } from "@remix-run/node";
import styled from "styled-components";
import { AdminHeader, MobileAdminHeader } from "~/components/header";
import { AdminSidebar } from "~/components/sidebar";
import { requireUser } from "~/services/session.server";
import { useViewportSize } from "@mantine/hooks";
import { useState } from "react";
import { isMobile } from "~/utils/mobile";

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
    return redirect("/logout");
  }

  if (!user.isAdmin) {
    return redirect("/partner/dashboard");
  }

  return null;
};

export default function Admin() {
  const submit = useSubmit();
  const viewportSize = useViewportSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <>
      <AdminPage>
        {isMobile(viewportSize.width) ? (
          <MobileAdminHeader
            onLogoutClick={() => {
              submit(null, { method: "post", action: "/logout" });
            }}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpen={() => setIsSidebarOpen(true)}
            onSidebarClose={() => setIsSidebarOpen(false)}
          />
        ) : (
          <AdminHeader
            onLogoutClick={() => {
              submit(null, { method: "post", action: "/logout" });
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
          }}
        >
          {isMobile(viewportSize.width) ? (
            <></>
          ) : (
            <AdminSidebar isMobile={false} />
          )}
          <Outlet />
        </div>
      </AdminPage>
    </>
  );
}
