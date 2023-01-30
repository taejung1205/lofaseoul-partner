// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";
import { redirect } from "react-router";
import { getSessionToken, verifySessionCookie } from "./firebaseAdmin.server";

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [process.env.SESSION_SECRET!], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // enable this in prod only
    maxAge: 60 * 60 * 24,
  },
});


export async function getUserSession(request: Request){
  const cookieSession = await sessionStorage.getSession(request.headers.get("Cookie"));
  const token = cookieSession.get("token");
  if(!token) return null;

  try{
    const tokenUser = await verifySessionCookie(token);
    return tokenUser;
  } catch(error){
    return null;
  }
}

export async function createUserSession(idToken: string, redirectTo: string) {
  const token = await getSessionToken(idToken);
  const session = await sessionStorage.getSession();
  session.set("token", token);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function destroyUserSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const newCookie = await sessionStorage.destroySession(session);

  return redirect("/login", { headers: { "Set-Cookie": newCookie } });
}
