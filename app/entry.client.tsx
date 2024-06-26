import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ClientProvider } from "@mantine/remix";

function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document,
      <ClientProvider>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </ClientProvider>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
