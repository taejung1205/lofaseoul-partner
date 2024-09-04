import { Outlet, useLoaderData, useSubmit } from "@remix-run/react";
import { LoaderFunction, redirect } from "@remix-run/node";
import { AdminHeader, MobileAdminHeader } from "~/components/header";
import { AdminSidebar } from "~/components/sidebar";
import { requireUser } from "~/services/session.server";
import { useViewportSize } from "@mantine/hooks";
import { useState } from "react";
import { isMobile } from "~/utils/mobile";

function AdminPage(props: React.HTMLProps<HTMLDivElement>) {
  const styles: React.CSSProperties = {
    width: "inherit",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    fontSize: "33px",
    textAlign: "center",
    fontWeight: 700,
    lineHeight: 1,
  };

  return <div style={styles} {...props} />;
}

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

  return { user: user };
};

export default function Admin() {
  const submit = useSubmit();
  const loaderData = useLoaderData();
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
            isStaff={loaderData.user.isStaff}
          />
        ) : (
          <AdminHeader
            onLogoutClick={() => {
              submit(null, { method: "post", action: "/logout" });
            }}
            isStaff={loaderData.user.isStaff}
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
            <AdminSidebar isMobile={false} isStaff={loaderData.user.isStaff} />
          )}
          <Outlet />
        </div>
      </AdminPage>
    </>
  );
}
