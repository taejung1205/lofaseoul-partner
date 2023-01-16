import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import styled from "styled-components";
import { PartnerProfile } from "~/components/partner_profile";
import authenticator from "~/services/auth.server";
import { getPartnerProfile } from "~/services/firebase.server";

const MyInfoPage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

export let loader: LoaderFunction = async ({ request }) => {
  let user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (user !== null && "name" in user) {
    const name = user.name;
    const profileDoc = await getPartnerProfile({ name: name });
    console.log(profileDoc);
    return profileDoc;
  } else {
    return null;
  }
};

export default function AdminPartnerList() {
  const loaderData = useLoaderData(); //Partner Profile List

  return (
    <MyInfoPage>
      {loaderData == null ? (
        <></>
      ) : (
        <PartnerProfile
          partnerProfile={{
            name: loaderData.name,
            id: loaderData.id,
            password: loaderData.password,
            email: loaderData.email,
            phone: loaderData.phone,
            lofaFee: loaderData.lofaFee,
            otherFee: loaderData.otherFee,
            shippingFee: loaderData.shippingFee,
          }}
          isNew={false}
          isEdit={false}
          onEditClick={() => {}}
          isPartner
        />
      )}
      <div style={{ height: "100px" }} />
      정보 수정 요청은 kyj@tabacpress.xyz 로 문의 부탁드립니다.
    </MyInfoPage>
  );
}
