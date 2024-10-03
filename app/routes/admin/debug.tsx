import { ActionFunction } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useRef } from "react";
import {
  debug_addExtraDataToRevenueDB,
  debug_addGwangjuBiennaleFee,
  debug_changeNoticeToMessage,
  debug_changePartnerNameToProviderName,
} from "~/services/firebase/debug.server";
import { addLog } from "~/services/firebase/firebase.server";
import { sendSettlementNoticeEmail } from "~/services/firebase/settlement.server";
import { sendResendBatchEmail } from "~/services/resend.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("request submitted");
  // await sendSettlementNoticeEmail({
  //   partnerList: ["김태정 테스트계정", "김태정 테스트계정"],
  // });
  // const result =
  // console.log(result);
  // await addLog("test", result);
  // if(result.data){
  //   console.log(result.data);
  // }
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
