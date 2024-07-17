import axios from "axios";

export async function sendAligoMessage({
  text,
  receiver,
}: {
  text: string;
  receiver: string;
}) {
  const msg = `${text}
  *해당 번호는 발신전용으로, 문자를 수신할 수 없습니다.`
  const aligoKey = process.env.ALIGO_KEY;
  if (!aligoKey) {
    throw new Error("ALIGO_KEY must be set");
  }
  const response = await axios.post(
    `https://asia-northeast3-lofaseoul-partner.cloudfunctions.net/sendAligoMessage?text=${msg}&receiver=${receiver}&key=${aligoKey}`,
  );
  console.log(response.data);
  return response.data;
}
