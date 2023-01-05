import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";

/**
 * check the user to see if there is an active session, if not
 * redirect to login page
 *
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
};

/**
 *  handle the logout request
 *
 * @param param0
 */
export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};

export default function Index() {
  const data = useLoaderData();
  console.log(data);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix Protected Dashboard</h1>
      <p>{data?.name}</p>
      <p>{data?.token}</p>
      <p>{data?.isAdmin ? "Hello" : "WOLD"}</p>
      <Form method="post">
        <button>Log Out</button>
      </Form>
    </div>
  );
}
