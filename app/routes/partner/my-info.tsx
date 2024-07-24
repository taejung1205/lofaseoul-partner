import { LoadingOverlay } from "@mantine/core";
import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import { getPartnerProfile } from "~/services/firebase.server";
import { requireUser } from "~/services/session.server";

export let loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
    const profileDoc = await getPartnerProfile({ name: partnerName });
    return profileDoc;
  } else {
    return redirect("/logout");
  }
};

export default function AdminPartnerList() {
  const loaderData = useLoaderData(); //Partner Profile List
  const navigation = useNavigation();

  return (
    <PageLayout>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
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
            brn: loaderData.brn,
            bankAccount: loaderData.bankAccount,
            businessName: loaderData.businessName,
            businessTaxStandard: loaderData.businessTaxStandard,
          }}
          isNew={false}
          isEdit={false}
          onEditClick={() => {}}
          isPartner
        />
      )}
      <div style={{ height: "100px" }} />
      정보 수정 요청은 kyj@tabacpress.xyz 로 문의 부탁드립니다.
      <div style={{ height: "100px" }} />
    </PageLayout>
  );
}
