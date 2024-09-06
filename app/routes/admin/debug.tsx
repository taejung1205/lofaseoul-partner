import { ActionFunction } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useRef } from "react";
import {
  debug_addExtraDataToRevenueDB,
  debug_addUploadedDate,
  debug_deleteAllTestRevenueData,
  debug_fixRevenueDataProviderName,
  debug_initializeIsDiscountedForSettlements,
} from "~/services/firebase-debug.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("request submitted");
  // await debug_fixRevenueDataProviderName("LOFA COLLAB", "로파콜랍");
  // await debug_fixRevenueDataProviderName("DOUBLE NOD", "더블노드");
  // await debug_fixRevenueDataProviderName("LOFA ORIGINAL", "로파오리지널");
  await debug_addExtraDataToRevenueDB();
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
