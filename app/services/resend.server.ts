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
    from: "tabacpress<syj@tabacpress.xyz>",
    to: to,
    subject: subject,
    html: html,
  });

  return result;
}

//mailList: {from: string; to: string[]; subject: string; html: string;}
export async function sendResendBatchEmail({ mailList }: { mailList: any[] }) {
  const result = await resend.batch.send(mailList);
  return result;
}
