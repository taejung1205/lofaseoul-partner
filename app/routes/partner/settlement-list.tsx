import { json, LoaderFunction, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  dateToKoreanMonth,
  MonthSelectPopover,
  dateToNumeralMonth,
  numeralMonthToKorean,
  getTimezoneDate,
} from "~/components/date";
import { PossibleSellers, SellerSelect } from "~/components/seller";
import {
  SettlementItem,
  SettlementTableMemo,
} from "~/components/settlement_table";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
} from "~/components/settlement_sum";
import { getSettlements, getSettlementSum } from "~/services/firebase.server";
import { PageLayout } from "~/components/page_layout";
import { GetListButton } from "~/components/button";
import { requireUser } from "~/services/session.server";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const ReportButton = styled.button`
  background-color: black;
  color: white;
  font-size: 24px;
  font-weight: 700;
  width: 220px;
  height: 50px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  margin-right: 40px;
  cursor: pointer;
`;

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/login");
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (month !== null) {
    const monthStr = numeralMonthToKorean(month);
    const settlements = await getSettlements({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    const sums = await getSettlementSum({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    return json({ settlements: settlements, sums: sums });
  } else {
    return null;
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [seller, setSeller] = useState<string>("all");
  const loaderData = useLoaderData();

  const monthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  const settlements: SettlementItem[] | null = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.settlements;
    }
  }, [loaderData]);

  const sums = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const allSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      return getAllSellerSettlementSum(sums);
    }
  }, [sums]);

  useEffect(() => {
    setSelectedDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    if (settlements !== null) {
      if (seller == "all") {
        setItems(settlements);
      } else if (seller == "etc") {
        const newItems = settlements.filter(
          (item) => !PossibleSellers.includes(item.seller)
        );
        setItems(newItems);
      } else {
        const newItems = settlements.filter((item) => item.seller == seller);
        setItems(newItems);
      }
      const newChecked = Array(items.length).fill(false);
      setItemsChecked(newChecked);
    }
  }, [settlements, seller]);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length ?? 0).fill(isChecked));
  }

  return (
    <>
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
            <Link to={`/partner/settlement-list?month=${monthNumeral}`}>
              <GetListButton>조회하기</GetListButton>
            </Link>
          </div>

          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {settlements == null ? (
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
        ) : items.length > 0 ? (
          <SettlementTableMemo
            items={items}
            itemsChecked={itemsChecked}
            onItemCheck={onItemCheck}
            onCheckAll={onCheckAll}
            defaultAllCheck={false}
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
        {items.length > 0 && allSum !== null ? (
          <>
            <div style={{ height: "20px" }} />
            <ReportButton
              onClick={() => {
                //TODO: 알리고
              }}
            >
              오류 보고
            </ReportButton>
            <div style={{ height: "40px" }} />
            <SettlementSumBar
              seller={seller ?? "all"}
              settlement={
                seller == "all"
                  ? allSum.settlement
                  : sums[`settlement_${seller}`]
              }
              shippingFee={
                seller == "all"
                  ? allSum.shippingFee
                  : sums[`shipping_${seller}`]
              }
            />
          </>
        ) : (
          <></>
        )}
      </PageLayout>
    </>
  );
}
