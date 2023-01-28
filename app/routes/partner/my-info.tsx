import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import { getCurrentUser } from "~/services/auth.server";
import { getPartnerProfile } from "~/services/firebase.server";

export let loader: LoaderFunction = async ({ request }) => {
  let user = await getCurrentUser();
  if (user !== null) {
    const name = user.uid;
    const profileDoc = await getPartnerProfile({ name: name });
    return profileDoc;
  } else {
    return null;
  }
};

export default function AdminPartnerList() {
  const loaderData = useLoaderData(); //Partner Profile List

  return (
    <PageLayout>
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
    </PageLayout>
  );
}
