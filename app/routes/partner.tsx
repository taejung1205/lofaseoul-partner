import {
  Outlet,
  useLoaderData,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import {
  json,
  LoaderFunction,
  redirect
} from "@remix-run/node";
import styled from "styled-components";
import { PartnerHeader } from "~/components/header";
import { PartnerSidebar } from "~/components/sidebar";
import { LoadingOverlay } from "@mantine/core";
import { requireUser } from "~/services/session.server";

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
  const transition = useTransition();

  return (
    <>
      {/* <LoadingOverlay
        visible={
          transition.state == "loading"
        }
        overlayBlur={2}
      /> */}
      <PartnerPage>
        <PartnerHeader
          username={loaderData.name}
          onLogoutClick={() =>
            submit(null, { method: "post", action: "/logout" })
          }
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
