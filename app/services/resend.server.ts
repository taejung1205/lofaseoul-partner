import { json } from "@remix-run/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);

export async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const result = await resend.emails.send({
    from: "kyj@tabacpress.xyz",
    to: to,
    subject: subject,
    html: html,
  });

  return result;
}
