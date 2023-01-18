import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { redirect } from "react-router";
import styled from "styled-components";
import {
  MonthSelectPopover,
  monthToKorean,
  monthToNumeral,
  numeralMonthToKorean,
} from "~/components/date";
import { SellerSelect as SellerSelect } from "~/components/seller";
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

const GetListButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  height: 40px;
  line-height: 1;
  margin-left: 20px;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (month !== null) {
    const monthStr = numeralMonthToKorean(month);
    const sums = await getAllSettlementSum({
      monthStr: monthStr,
    });
    console.log(sums);
    return json({ sums: sums });
  } else {
    return null;
  }
};

export default function AdminSettlementManage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [seller, setSeller] = useState<string>("all");
  const loaderData = useLoaderData();

  const monthNumeral = useMemo(
    () => monthToNumeral(selectedDate ?? new Date()),
    [selectedDate]
  );

  const sums = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(monthToKorean(selectedDate));
    }
  }, [selectedDate]);

  return (
    <SettlementManagePage>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <MonthSelectPopover
            onLeftClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() - 1))
              )
            }
            onRightClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() + 1))
              )
            }
            monthStr={selectedMonthStr ?? ""}
          />
          <Link to={`/partner/settlement-manage?month=${monthNumeral}`}>
            <GetListButton type="submit">조회하기</GetListButton>
          </Link>
        </div>

        <SellerSelect
          seller={seller}
          setSeller={setSeller}
        />
      </div>
    </SettlementManagePage>
  );
}
