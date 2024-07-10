import { Space } from "@mantine/core";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import {
  addPartnerProfile,
  deletePartnerProfile,
  getPartnerProfiles,
} from "~/services/firebase.server";
import writeXlsxFile from "write-excel-file";

const MyButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 180px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  let error = "";
  const actionType = body.get("action")?.toString();
  if (actionType === "add") {
    const name = body.get("name")?.toString();
    const id = body.get("id")?.toString();
    const password = body.get("password")?.toString();
    const email = body.get("email")?.toString();
    const phone = body.get("phone")?.toString();
    const lofaFee = Number(body.get("lofaFee"));
    const otherFee = Number(body.get("otherFee"));
    const shippingFee = Number(body.get("shippingFee"));
    const brn = body.get("brn")?.toString();
    const bankAccount = body.get("bankAccount")?.toString();
    const businessName = body.get("businessName")?.toString();
    const businessTaxStandard = body.get("businessTaxStandard")?.toString();

    if (
      typeof name == "undefined" ||
      typeof id == "undefined" ||
      typeof password == "undefined" ||
      typeof email == "undefined" ||
      typeof phone == "undefined"
    ) {
      console.log("Error");
      error = "데이터가 유효하지 않습니다.";
    } else {
      let partnerProfile: PartnerProfile = {
        name: name,
        id: id,
        password: password,
        email: email,
        phone: phone,
        lofaFee: lofaFee,
        otherFee: otherFee,
        shippingFee: shippingFee,
        brn: brn ?? "",
        bankAccount: bankAccount ?? "",
        businessName: businessName ?? "",
        businessTaxStandard : businessTaxStandard ?? ""
      };
      const addPartnerResult = await addPartnerProfile({
        partnerProfile,
      });

      if (typeof addPartnerResult == "string") {
        error = addPartnerResult;
      }
    }
  } else if (actionType === "delete") {
    const name = body.get("name")?.toString();
    if (typeof name == "undefined") {
      console.log("Error");
      error = "Data invalid while deleting partner profile";
    } else {
      const deletePartnerResult: any = await deletePartnerProfile({
        name: name,
      });
      if (typeof deletePartnerResult == "string") {
        error = deletePartnerResult;
      }
    }
  }

  return json({ error: error });
};

export let loader: LoaderFunction = async ({ request }) => {
  const profileDocs = await getPartnerProfiles();
  const profileArr = Array.from(profileDocs.values());
  return profileArr;
};

export default function AdminPartnerList() {
  const [currentEdit, setCurrentEdit] = useState<number>(-1);
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const loaderData = useLoaderData(); //Partner Profile List
  const actionData = useActionData();

  useEffect(() => {
    setIsCreatingProfile(false);
    setCurrentEdit(-1);
  }, [actionData]);

  async function writeExcel() {
    await writeXlsxFile(loaderData, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `파트너목록.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  return (
    <PageLayout>
      {actionData?.error?.length > 0 ? (
        <div style={{ margin: "10px" }}>{actionData.error}</div>
      ) : (
        <></>
      )}
      <div style={{ display: "flex" }}>
        <MyButton onClick={() => setIsCreatingProfile((prev) => !prev)}>
          신규 생성
        </MyButton>
        <Space w={20} />
        <MyButton onClick={() => writeExcel()}>
          목록 다운로드
        </MyButton>
      </div>

      <div style={{ minHeight: "40px" }} />
      {isCreatingProfile ? (
        <PartnerProfile
          partnerProfile={{
            name: "",
            id: "",
            password: "",
            email: "",
            phone: "",
            lofaFee: 0,
            otherFee: 0,
            shippingFee: 0,
            brn: "",
            bankAccount: "",
            businessName: "",
            businessTaxStandard: ""
          }}
          isNew={true}
          isEdit={true}
          onEditClick={() => {}}
          isPartner={false}
        />
      ) : (
        <></>
      )}
      {loaderData.map((doc: DocumentData, index: number) => {
        return (
          <PartnerProfile
            key={`PartnerProfile-${index}`}
            partnerProfile={{
              name: doc.name,
              id: doc.id,
              password: doc.password,
              email: doc.email,
              phone: doc.phone,
              lofaFee: doc.lofaFee,
              otherFee: doc.otherFee,
              shippingFee: doc.shippingFee,
              brn: doc.brn,
              bankAccount: doc.bankAccount,
              businessName: doc.businessName,
              businessTaxStandard: doc.businessTaxStandard
            }}
            isEdit={currentEdit == index}
            onEditClick={() => {
              setCurrentEdit(index);
            }}
            isPartner={false}
            isNew={false}
          />
        );
      })}
      <div style={{ minHeight: "40px" }} />
    </PageLayout>
  );
}



const schema = [
  {
    column: "파트너명",
    type: String,
    value: (profile: PartnerProfile) => profile.name,
    width: 30,
    wrap: true,
  },
  {
    column: "아이디",
    type: String,
    value: (profile: PartnerProfile) => profile.id,
    width: 30,
    wrap: true,
  },
  {
    column: "비밀번호",
    type: String,
    value: (profile: PartnerProfile) => profile.password,
    width: 30,
    wrap: true,
  },
  {
    column: "이메일",
    type: String,
    value: (profile: PartnerProfile) => profile.email,
    width: 30,
    wrap: true,
  },
  {
    column: "전화번호",
    type: String,
    value: (profile: PartnerProfile) => profile.phone,
    width: 30,
    wrap: true,
  },
  {
    column: "로파채널 수수로",
    type: Number,
    value: (profile: PartnerProfile) => profile.lofaFee,
    width: 20,
  },
  {
    column: "외부채널 수수료",
    type: Number,
    value: (profile: PartnerProfile) => profile.otherFee,
    width: 20,
  },
  {
    column: "배송비",
    type: Number,
    value: (profile: PartnerProfile) => profile.shippingFee,
    width: 20,
  },
  {
    column: "사업자등록번호",
    type: String,
    value: (profile: PartnerProfile) => profile.brn,
    width: 30,
    wrap: true,
  },
  {
    column: "계좌번호",
    type: String,
    value: (profile: PartnerProfile) => profile.bankAccount,
    width: 30,
    wrap: true,
  },
  {
    column: "사업자명",
    type: String,
    value: (profile: PartnerProfile) => profile.businessName,
    width: 30,
    wrap: true,
  },
  {
    column: "사업자과세기준",
    type: String,
    value: (profile: PartnerProfile) => profile.businessTaxStandard,
    width: 30,
    wrap: true,
  },
];
