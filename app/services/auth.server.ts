import { Authenticator, AuthorizationError } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { sessionStorage, User } from "~/services/session.server";
import { doLogin } from "./firebase.server";

// Create an instance of the authenticator, pass a Type, User,  with what
// strategies will return and will store in the session
const authenticator = new Authenticator<User | Error | null>(sessionStorage, {
  sessionKey: process.env.AUTH_SESSION_KEY, // keep in sync
  sessionErrorKey: process.env.AUTH_SESSION_ERROR_KEY, // keep in sync
});

// Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    // get the data from the form...
    let id = form.get("id") as string;
    let password = form.get("password") as string;

    // initialize the user here
    let user = null;

    // do some validation, errors are in the sessionErrorKey
    if (!id || id?.length === 0)
      throw new AuthorizationError("아이디를 입력해주세요.");
    if (typeof id !== "string")
      throw new AuthorizationError("아이디가 올바르지 않습니다.");

    if (!password || password?.length === 0)
      throw new AuthorizationError("비밀번호를 입력해주세요.");
    if (typeof password !== "string")
      throw new AuthorizationError(
        "비밀번호가 올바르지 않습니다."
      );

    const loginResult = await doLogin({
      id: id,
      password: password,
    });

    // login the user, this could be whatever process you want
    if (loginResult != "fail") {
      user = {
        name: loginResult,
        token: `${id}-${new Date().getTime()}`,
        isAdmin: loginResult == "admin" ? true : false,
      };

      // the type of this user must match the type you pass to the Authenticator
      // the strategy will automatically inherit the type if you instantiate
      // directly inside the `use` method
      return await Promise.resolve({ ...user });
    } else {
      // if problem with user throw error AuthorizationError
      throw new AuthorizationError("로그인에 실패하였습니다. 입력한 정보를 확인해주세요.");
    }
  })
);

export default authenticator;
