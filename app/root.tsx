import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import globalStyle from "~/styles/global.style.css";
import { MantineProvider, createEmotionCache } from "@mantine/core";

// export const meta: MetaFunction = () => ({
//   charset: "utf-8",
//   title: "LOFASEOUL PARTNERS",
//   viewport: "width=device-width,initial-scale=1",
// });

createEmotionCache({ key: "mantine" });

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: globalStyle,
      as: "style",
    },
    // {
    //   rel: "icon",
    //   href: "image/favicon.svg",
    // },
  ];
};

export function ErrorBoundary({ error }: { error: any }) {
  console.error("ERROR", error);
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div
          style={{
            width: "inherit",
            height: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "700",
            margin: "auto",
          }}
        >
          <div style={{ fontSize: "20px", margin: "10px" }}>
            에러가 발생했습니다.
          </div>
          <div style={{ fontSize: "16px", margin: "10px" }}>{error.name}</div>
          <div style={{ fontSize: "16px", margin: "10px" }}>
            {error.message}
          </div>
          <div style={{ fontSize: "12px", margin: "10px" }}>
            오류가 지속될 경우 관리자에게 문의해주세요.
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <html lang="en">
        <head>
          <Meta />
          <Links />
          {typeof document === "undefined" ? "__STYLES__" : null}
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <LiveReload />
          <Scripts />
        </body>
      </html>
    </MantineProvider>
  );
}
