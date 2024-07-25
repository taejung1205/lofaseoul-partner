import { LoadingOverlay } from "@mantine/core";
import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { json } from "react-router";
import { PageLayout } from "~/components/page_layout";
import {
  getDelayedOrdersCount,
  getTodayOrdersCount,
  getTodayWaybillsCount,
} from "~/services/firebase.server";

function DashboardItemBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    width: "40%",
    backgroundColor: "#f0f0f0",
    padding: "15px 30px 30px 15px", // shorthand for padding properties
    margin: "10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontWeight: 700,
    height: "200px",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export const loader: LoaderFunction = async ({ request }) => {
  const ordersCount = await getTodayOrdersCount();
  const waybillsCount = await getTodayWaybillsCount();
  const delayedOrdersCount = await getDelayedOrdersCount(3);

  return json({
    ordersCount: ordersCount,
    waybillsCount: waybillsCount,
    delayedOrdersCount: delayedOrdersCount,
  });
};

export default function AdminDashboard() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      <PageLayout>
        <div style={{ display: "flex", width: "inherit" }}>
          <DashboardItemBox>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              금일 공유된 주문건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right" }}>
              {loaderData.ordersCount}건
            </div>
          </DashboardItemBox>
          <DashboardItemBox>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              어제 운송장 입력 완료된 주문 건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right" }}>
              {loaderData.waybillsCount}건
            </div>
          </DashboardItemBox>
        </div>
        <div style={{ display: "flex", width: "inherit" }}>
          <DashboardItemBox>
            <div style={{ fontSize: "20px", textAlign: "left" }}>
              3일 이상 미출고된 주문건
            </div>
            <div style={{ fontSize: "36px", textAlign: "right", color: "red" }}>
              {loaderData.delayedOrdersCount}건
            </div>
          </DashboardItemBox>
          <DashboardItemBox></DashboardItemBox>
        </div>
      </PageLayout>
    </>
  );
}
