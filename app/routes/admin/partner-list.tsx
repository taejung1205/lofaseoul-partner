import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { PartnerProfile } from "~/components/partner_profile";
import {
  addPartnerProfile,
  deletePartnerProfile,
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
  cursor: pointer;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  let result = "";
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

    if (
      typeof name == "undefined" ||
      typeof id == "undefined" ||
      typeof password == "undefined" ||
      typeof email == "undefined" ||
      typeof phone == "undefined"
    ) {
      console.log("Error");
      result = "Data invalid while adding/editing partner profile";
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
      };
      const addPartnerResult = await addPartnerProfile({
        partnerProfile,
      });
      // console.log(result);
      result = "Adding/Editing partner profile OK";
    }
  } else if (actionType === "delete") {
    const name = body.get("name")?.toString();
    if (typeof name == "undefined") {
      console.log("Error");
      result = "Data invalid while deleting partner profile";
    } else {
      const deletePartnerResult = await deletePartnerProfile({ name: name });
      result = "Deleting partner profile OK";
    }
  }

  return json(result);
};

export let loader: LoaderFunction = async ({ request }) => {
  const profileDocs = await getPartnerProfiles();
  return profileDocs;
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

  return (
    <PartnerListPage>
      <NewProfileButton onClick={() => setIsCreatingProfile((prev) => !prev)}>
        신규 생성
      </NewProfileButton>
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
    </PartnerListPage>
  );
}
