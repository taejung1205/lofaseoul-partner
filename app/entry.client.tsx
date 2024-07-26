import { RemixBrowser } from "@remix-run/react";
import { ClientProvider } from "@mantine/remix";
import { hydrate } from "react-dom";


hydrate(
  <ClientProvider>
    <RemixBrowser />
  </ClientProvider>,
  document
);


