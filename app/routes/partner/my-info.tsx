import { LoadingOverlay } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { useMemo } from "react";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import { getPartnerProfile } from "~/services/firebase/firebase.server";
import { requireUser } from "~/services/session.server";
import { isMobile } from "~/utils/mobile";

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
  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  return (
    <PageLayout isMobile={isMobileMemo}>
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
            gwangjuBiennaleFee: loaderData.gwangjuBiennaleFee,
            shippingFee: loaderData.shippingFee,
            brn: loaderData.brn,
            bankAccount: loaderData.bankAccount,
            businessName: loaderData.businessName,
            businessTaxStandard: loaderData.businessTaxStandard,
            providerName: loaderData.providerName,
            productCategory: loaderData.productCategory,
          }}
          isNew={false}
          isEdit={false}
          onEditClick={() => {}}
          isPartner
        />
      )}
      <div style={{ height: "100px" }} />
      정보 수정 요청은 syj@tabacpress.xyz 로 문의 부탁드립니다.
      <div style={{ height: "100px" }} />
    </PageLayout>
  );
}
