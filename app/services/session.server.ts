// app/services/session.server.ts
import { createCookieSessionStorage, json, redirect } from "@remix-run/node";
import { auth } from "./firebaseAdmin.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export type User = {
  idToken: string;
  email: string;
  uid: string;
  isAdmin: boolean;
};

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [sessionSecret], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // enable this in prod only
    maxAge: 60 * 60 * 24 * 5, // 5 days
  },
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;

export function getUserSession(request: Request) {
  return getSession(request.headers.get("Cookie"));
}

export async function createUserSession({
  user,
  isRedirect,
}: {
  user: User;
  isRedirect: boolean;
}) {

  if (!user.idToken || !user.uid || !user.email) {
    return json(
      {
        errorCode: 'session/missing-param',
        errorMessage: 'Missing required session params',
      },
      { status: 422 }
    );
  }
  // expires in 5 days
  const expiresIn = 60 * 60 * 24 * 5;
  // Create the session cookie. This will also verify the ID token in the process.
  // The session cookie will have the same claims as the ID token.

  try {

    const sessionIdToken = await auth.createSessionCookie(user.idToken, {
      expiresIn,
    });

    const session = await getSession();
    session.set('sessionIdToken', sessionIdToken); // update to sessionIdToken
    session.set("idToken", user.idToken);
    session.set("email", user.email);
    session.set("uid", user.uid);
    session.set("isAdmin", user.isAdmin);

    if (isRedirect) {
      if (user.isAdmin) {
        return redirect("/admin/dashboard", {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        });
      } else {
        return redirect("/partner/dashboard", {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        });
      }
    } else {
      return json(
        { status: "success" },
        {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
          status: 201,
        }
      );
    }
  } catch (error) {
    return json(
      {
        errorCode: "session/create",
        errorMessage: "Could not create session: " + error,
      },
      {
        status: 500,
      }
    );
  }
}

export async function destroyUserSession(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect("/login", {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
}

export async function requireUser(
  request: Request
) {
  const session = await getUserSession(request);
  const tokenId = session.get('sessionIdToken');
  const isAdmin = session.get('isAdmin');
  if (!tokenId || typeof tokenId !== 'string' || isAdmin == undefined) {
    return null;
  }
  try {
    const decodedClaims = await auth.verifySessionCookie(tokenId);
    return {...decodedClaims, isAdmin: isAdmin};
  } catch (error: any) {
    destroyUserSession(request);
    return null;
  }
}


