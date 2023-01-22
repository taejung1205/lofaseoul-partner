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

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "LOFASEOUL PARTNERS",
  viewport: "width=device-width,initial-scale=1",
});

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
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </MantineProvider>
  );
}
