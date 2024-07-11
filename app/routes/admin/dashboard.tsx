import { LoadingOverlay } from "@mantine/core";
import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { json } from "react-router";
import styled from "styled-components";
import { PageLayout } from "~/components/page_layout";
import {
  getDelayedOrdersCount,
  getTodayOrdersCount,
  getTodayWaybillsCount,
} from "~/services/firebase.server";

const DashboardItemBox = styled.div`
  width: 40%;
  background-color: #f0f0f0;
  padding-left: 15px;
  padding-top: 15px;
  padding-right: 30px;
  padding-bottom: 30px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-weight: 700;
  height: 200px;
`;

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
      <LoadingOverlay
        visible={navigation.state == "loading"}
        overlayBlur={2}
      />
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
