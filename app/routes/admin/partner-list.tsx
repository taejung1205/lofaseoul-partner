import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DocumentData } from "firebase/firestore";
import { useState } from "react";
import styled from "styled-components";
import { PartnerProfile } from "~/components/partner_profile";
import {
  addPartnerProfile,
  getPartnerProfiles,
} from "~/services/firebase.server";

const PartnerListPage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  overflow-y: scroll;
`;

const NewProfileButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const name = body.get("name")?.toString();
  const id = body.get("id")?.toString();
  const password = body.get("password")?.toString();
  const email = body.get("email")?.toString();
  const phone = body.get("phone")?.toString();
  const lofaFee = Number(body.get("lofaFee"));
  const otherFee = Number(body.get("otherFee"));
  const shippingFee = Number(body.get("shippingFee"));

  if (
    typeof name == "undefined" ||
    typeof id == "undefined" ||
    typeof password == "undefined" ||
    typeof email == "undefined" ||
    typeof phone == "undefined"
  ) {
    console.log("Error");
  } else {
    const result = await addPartnerProfile({
      name: name,
      id: id,
      password: password,
      email: email,
      phone: phone,
      lofaFee: lofaFee,
      otherFee: otherFee,
      shippingFee: shippingFee,
    });
    console.log(result);
  }

  return null;
};

export let loader: LoaderFunction = async ({ request }) => {
  const profileDocs = await getPartnerProfiles();
  return profileDocs;
};

export default function AdminPartnerList() {
  const [currentEdit, setCurrentEdit] = useState<number>(-1);
  const data = useLoaderData(); //Partner Profile List
  return (
    <PartnerListPage>
      <NewProfileButton>신규 생성</NewProfileButton>
      <div style={{ height: "40px" }} />
      {data.map((doc: DocumentData, index: number) => {
        return (
          <PartnerProfile
            name={doc.name}
            id={doc.id}
            password={doc.password}
            email={doc.email}
            phone={doc.phone}
            lofaFee={doc.lofaFee}
            otherFee={doc.otherFee}
            isNew={false}
            shippingFee={doc.shippingFee}
            isEdit={currentEdit == index}
            onEditClick={() => {
              setCurrentEdit(index);
            }}
            onSaveClick={() => {
              setCurrentEdit(-1);
            }}
          />
        );
      })}
    </PartnerListPage>
  );
}
