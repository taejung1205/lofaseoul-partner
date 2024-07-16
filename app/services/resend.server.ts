import { json } from "@remix-run/node";
import { Resend } from "resend";

const resend = new Resend("re_SQ1A4uEs_JB3BAVbpTaQVEbzXR2DRjW78");

export async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const {data, error} = await resend.emails.send({
    from: "kyj@tabacpress.xyz",
    to: to,
    subject: subject,
    html: html,
  });

  if (error) {
    console.log("error", error);
    return json({ result: error.message });
  }

  return json({result: data});
}
