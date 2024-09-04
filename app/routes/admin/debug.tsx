import { ActionFunction } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useRef } from "react";
import { debug_addUploadedDate, debug_deleteAllTestRevenueData, debug_initializeIsDiscountedForSettlements } from "~/services/firebase-debug.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("request submitted");
  debug_deleteAllTestRevenueData();
  return null;
};

export default function Debug() {
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <>
      <button
        onClick={() => {
          const formData = new FormData(formRef.current ?? undefined);
          submit(formData, { method: "post" });
        }}
      >
        {"DEBUG"}
      </button>
    </>
  );
}
