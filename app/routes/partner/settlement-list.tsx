import { Select } from "@mantine/core";
import { json, LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  monthToKorean,
  MonthSelectPopover,
  monthToNumeral,
  numeralMonthToKorean,
} from "~/components/date";
import { PossibleSellers } from "~/components/seller";
import {
  getAllSellerSettlementSum,
  SettlementItem,
  SettlementSumBar,
  SettlementTableMemo,
} from "~/components/settlement";
import authenticator from "~/services/auth.server";
import { getSettlements, getSettlementSum } from "~/services/firebase.server";

const SettlementListPage = styled.div`
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
  let partnerName: string;
  let user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (user !== null && "name" in user) {
    partnerName = user.name;
  } else {
    return null;
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
  const [seller, setSeller] = useState<string | null>("all");
  const loaderData = useLoaderData();

  const monthNumeral = useMemo(
    () => monthToNumeral(selectedDate ?? new Date()),
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

  const allSum = useMemo(() => getAllSellerSettlementSum(sums), [sums])

  useEffect(() => {
    setSelectedDate(new Date());
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
      setSelectedMonthStr(monthToKorean(selectedDate));
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
      <SettlementListPage>
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
              <GetListButton type="submit">조회하기</GetListButton>
            </Link>
          </div>

          <Select
            value={seller}
            onChange={setSeller}
            data={[
              { value: "all", label: "전체 판매처" },
              { value: "29cm", label: "29cm" },
              { value: "EQL", label: "EQL" },
              { value: "로파공홈", label: "로파 홈페이지" },
              { value: "오늘의집", label: "오늘의집" },
              { value: "카카오", label: "카카오" },
              { value: "etc", label: "기타" },
            ]}
            styles={{
              input: {
                fontSize: "20px",
                fontWeight: "bold",
                borderRadius: 0,
                border: "3px solid black !important",
                height: "40px",
              },
              item: {
                "&[data-selected]": {
                  backgroundColor: "grey",
                },
              },
            }}
          />
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
        {items.length > 0 ? (
          <>
            <div style={{ height: "20px" }} />
            <button>오류 보고</button>
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
      </SettlementListPage>
    </>
  );
}
