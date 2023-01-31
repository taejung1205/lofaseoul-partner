import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { GetListButton } from "~/components/button";
import {
  MonthSelectPopover,
  dateToKoreanMonth,
  dateToNumeralMonth,
  numeralMonthToKorean,
  getTimezoneDate,
} from "~/components/date";
import { PageLayout } from "~/components/page_layout";
import { SellerSelect } from "~/components/seller";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
  SettlementSumItem,
  SettlementSumTable,
} from "~/components/settlement_sum";
import { getAllSettlementSum } from "~/services/firebase.server";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
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
    return json({ sums: sums, month: month });
  } else {
    return null;
  }
};

export default function AdminSettlementManage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [seller, setSeller] = useState<string>("all");
  const loaderData = useLoaderData();

  const selectedMonthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  const sums: SettlementSumItem[] = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const totalSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      let settlementSum = 0;
      let shippingSum = 0;
      if (seller == "all") {
        sums.forEach((item) => {
          const sum = getAllSellerSettlementSum(item.data);
          settlementSum += sum.settlement;
          shippingSum += sum.shippingFee;
        });
      } else {
        sums.forEach((item) => {
          settlementSum += item.data[`settlement_${seller}`];
          shippingSum += item.data[`shipping_${seller}`];
        });
      }
      return {
        settlement: settlementSum,
        shipping: shippingSum,
      };
    }
  }, [sums, seller]);

  useEffect(() => {
    setSelectedDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  return (
    <PageLayout>
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
          <Link to={`/admin/settlement-manage?month=${selectedMonthNumeral}`}>
            <GetListButton>조회하기</GetListButton>
          </Link>
        </div>

        <SellerSelect seller={seller} setSeller={setSeller} />
      </div>
      <div style={{ height: "20px" }} />
      {sums == null ? (
        <EmptySettlementBox
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: "30px",
            height: "100px",
            alignItems: "center",
            justifyContent: "center",
            width: "inherit",
          }}
        >
          조회하기 버튼을 클릭하여 정산내역을 확인할 수 있습니다.
        </EmptySettlementBox>
      ) : sums.length > 0 ? (
        <SettlementSumTable
          items={sums}
          seller={seller}
          monthNumeral={loaderData.month}
        />
      ) : (
        <EmptySettlementBox
          style={{
            display: "flex",
            textAlign: "center",
            fontSize: "30px",
            height: "100px",
            alignItems: "center",
            justifyContent: "center",
            width: "inherit",
          }}
        >
          공유된 정산내역이 없습니다.
        </EmptySettlementBox>
      )}
      {sums !== null && sums.length > 0 && totalSum !== null ? (
        <>
          <div style={{ height: "40px" }} />
          <SettlementSumBar
            seller={seller ?? "all"}
            settlement={totalSum?.settlement}
            shippingFee={totalSum?.shipping}
          />
        </>
      ) : (
        <></>
      )}
    </PageLayout>
  );
}
