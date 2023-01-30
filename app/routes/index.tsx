import { LoaderFunction, redirect } from "@remix-run/node";
import { requireUser } from "~/services/session.server";

/**
 * check the user to see if there is an active session, if not
 * redirect to login page
 *
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/login");
  }

  if (user.isAdmin !== undefined) {
    if (user.isAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return redirect("/partner/dashboard");
    }
  } else {
    return redirect("/login");
  }
};

export default function Index() {
  return <div></div>;
}
