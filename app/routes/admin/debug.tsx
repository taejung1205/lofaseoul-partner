import { PartnerProfile } from "~/components/partner_profile";

import * as xlsx from "xlsx";
import { useSubmit } from "@remix-run/react";
import { useRef } from "react";
import { ActionFunction } from "@remix-run/node";
import { addPartnerProfiles } from "~/services/firebase.server";

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const accounts = body.get("accounts")?.toString();
  const jsonArr: PartnerProfile[] = JSON.parse(accounts!);
  await addPartnerProfiles({ partnerProfiles: jsonArr });

  return null;
};

export default function AdminOrderShare() {
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  const readExcel = (e: any) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: PartnerProfile[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: PartnerProfile = {
            name: element.업체명,
            id: element.아이디,
            password: element.패스워드,
            email: element.이메일 ?? "",
            phone: element.연락처 ?? "",
            lofaFee: element.공홈,
            otherFee: element.타채널,
            shippingFee: element.배송비,
          };
          if (item.name === "어드민") {
            break;
          }
          array.push(item);
        }
        console.log(array);
        addAccounts(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  function addAccounts(partnerList: PartnerProfile[]) {
    const json = JSON.stringify(partnerList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("accounts", json);
    submit(formData, { method: "post" });
  }

  return (
    <>
      <p>주문서 공유</p>
      <input
        type="file"
        onChange={readExcel}
        id="uploadFile"
        accept=".xlsx,.xls"
      />
    </>
  );
}
