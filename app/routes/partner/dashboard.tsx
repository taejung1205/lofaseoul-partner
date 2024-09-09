import { LoadingOverlay } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { useMemo } from "react";
import { json } from "react-router";
import { PageLayout } from "~/components/page_layout";
import { getPartnerDelayedOrdersCount } from "~/services/firebase/delayedOrder.server";
import { getPartnerTodayOrdersCount } from "~/services/firebase/order.server";
import { getPartnerTodayWaybillsCount } from "~/services/firebase/waybill.server";
import { requireUser } from "~/services/session.server";
import { isMobile } from "~/utils/mobile";

interface DashboardItemBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile: boolean;
}

export function DashboardItemBox({
  isMobile,
  children,
  ...props
}: DashboardItemBoxProps) {
  const boxStyles: React.CSSProperties = {
    width: isMobile ? "100%" : "40%",
    backgroundColor: "#f0f0f0",
    paddingLeft: "15px",
    paddingTop: "15px",
    paddingRight: "30px",
    paddingBottom: "30px",
    margin: "10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontWeight: 700,
    minHeight: "200px",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/logout");
  }

  const ordersCount = await getPartnerTodayOrdersCount(partnerName);
  const waybillsCount = await getPartnerTodayWaybillsCount(partnerName);
  const delayedOrdersCount = await getPartnerDelayedOrdersCount(3, partnerName);

  return json({
    ordersCount: ordersCount,
    waybillsCount: waybillsCount,
    delayedOrdersCount: delayedOrdersCount,
  });
};

export default function PartnerDashboard() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();

  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      <PageLayout isMobile={isMobileMemo}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobileMemo ? "column" : "row",
            width: "inherit",
          }}
        >
          <DashboardItemBox isMobile={isMobileMemo}>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              금일 공유된 주문건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right" }}>
              {loaderData.ordersCount}건
            </div>
          </DashboardItemBox>
          <DashboardItemBox isMobile={isMobileMemo}>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              어제 운송장 입력 완료된 주문 건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right" }}>
              {loaderData.waybillsCount}건
            </div>
          </DashboardItemBox>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: isMobileMemo ? "column" : "row",
            width: "inherit",
          }}
        >
          <DashboardItemBox isMobile={isMobileMemo}>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              3일 이상 미출고된 주문건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right", color: "red" }}>
              {loaderData.delayedOrdersCount}건
            </div>
          </DashboardItemBox>
        </div>
      </PageLayout>
    </>
  );
}
