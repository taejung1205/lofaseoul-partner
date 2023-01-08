import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DocumentData } from "firebase/firestore";
import { useState } from "react";
import styled from "styled-components";
import { PartnerProfile } from "~/components/partner_profile";
import { getPartnerProfiles } from "~/services/firebase.server";

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
  console.log(body.get("name"));
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
            shippingFee={doc.shippingFee}
            isEdit={currentEdit == index}
            onEditClick={() => {
              setCurrentEdit(index);
            }}
            onSaveClick={() => {}}
          />
        );
      })}
    </PartnerListPage>
  );
}
