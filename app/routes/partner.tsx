import { Outlet, useLoaderData, useSubmit } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import styled from "styled-components";
import { MobilePartnerHeader, PartnerHeader } from "~/components/header";
import { PartnerSidebar } from "~/components/sidebar";
import { requireUser } from "~/services/session.server";
import { useState } from "react";
import { useViewportSize } from "@mantine/hooks";
import { isMobile } from "~/utils/mobile";

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
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/logout");
  }

  if (user.isAdmin !== null) {
    if (user.isAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return json({ name: user.uid });
    }
  } else {
    return redirect("/logout");
  }
};

export default function Partner() {
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const viewportSize = useViewportSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <>
      {/* <LoadingOverlay
        visible={
          transition.state == "loading"
        }
        overlayBlur={2}
      /> */}
      <PartnerPage>
        {isMobile(viewportSize.width) ? (
          <MobilePartnerHeader
            username={loaderData.name}
            onLogoutClick={() =>
              submit(null, { method: "post", action: "/logout" })
            }
            isSidebarOpen={isSidebarOpen}
            onSidebarOpen={() => setIsSidebarOpen(true)}
            onSidebarClose={() => setIsSidebarOpen(false)}
          />
        ) : (
          <PartnerHeader
            username={loaderData.name}
            onLogoutClick={() =>
              submit(null, { method: "post", action: "/logout" })
            }
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
            <PartnerSidebar isMobile={false} />
          )}
          <Outlet />
        </div>
      </PartnerPage>
    </>
  );
}
