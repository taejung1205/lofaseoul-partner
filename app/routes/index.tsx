import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { isCurrentUserAdmin } from "~/services/auth.server";

/**
 * check the user to see if there is an active session, if not
 * redirect to login page
 *
 * @param param0
 * @returns
 */
export let loader: LoaderFunction = async ({ request }) => {

  const userAdmin = await isCurrentUserAdmin(); //로그인 안됐을 경우 null, 했을 경우 admin 여부
  if (userAdmin !== null) {
    if (userAdmin) {
      return redirect("/admin/dashboard");
    } else {
      return redirect("/partner/dashboard");
    }
  } else {
    return redirect("/login");
  }
};

export default function Index() {
  return (
    <div>
    </div>
  );
}
