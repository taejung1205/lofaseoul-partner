import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { json } from "react-router";
import styled from "styled-components";
import { PageLayout } from "~/components/page_layout";
import {
  getPartnerDelayedOrdersCount,
  getPartnerTodayOrdersCount,
  getPartnerTodayWaybillsCount,
} from "~/services/firebase.server";
import { requireUser } from "~/services/session.server";

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

  return (
    <>
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
