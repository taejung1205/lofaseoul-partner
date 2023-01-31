import axios from "axios";

export async function sendAligoMessage({
  text,
  receiver,
}: {
  text: string;
  receiver: string;
}) {
  const aligoKey = process.env.ALIGO_KEY;
  if (!aligoKey) {
    throw new Error("ALIGO_KEY must be set");
  }
  const response = await axios.post(
    `https://asia-northeast3-lofaseoul-partner.cloudfunctions.net/sendAligoMessage?text=${text}&receiver=${receiver}&key=${aligoKey}`,
  );
  console.log(response.data);
  return response.data;
}
