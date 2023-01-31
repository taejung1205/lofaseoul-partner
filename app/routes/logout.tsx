import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { destroyUserSession } from "~/services/session.server";

export const loader: LoaderFunction = async () => {
  // not expecting direct access, so redirect away
  return redirect("/login");
};

export const action: ActionFunction = async ({ request }) => {
  return destroyUserSession(request);
};
