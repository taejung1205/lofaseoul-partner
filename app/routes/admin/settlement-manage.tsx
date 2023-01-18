import { json, LoaderFunction } from "@remix-run/node";
import { redirect } from "react-router";
import styled from "styled-components";
import { monthToNumeral, numeralMonthToKorean } from "~/components/date";
import { getAllSettlementSum } from "~/services/firebase.server";

const SettlementManagePage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 30px 40px 30px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (month == null) {
    const today = new Date();
    const todayMonthNumeral = monthToNumeral(today);
    return redirect(`/admin/settlement-manage?month=${todayMonthNumeral}`);
  }

  const monthStr = numeralMonthToKorean(month);
  const sums = await getAllSettlementSum({
    monthStr: monthStr,
  });
  console.log(sums);
  return json({ sums: sums });
};

export default function AdminSettlementManage() {
  return (
    <SettlementManagePage>

    </SettlementManagePage>
  );
}
