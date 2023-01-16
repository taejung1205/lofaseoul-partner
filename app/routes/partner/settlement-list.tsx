import { LoaderFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  monthToKorean,
  MonthSelectPopover,
  monthToNumeral,
} from "~/components/date";
import { SettlementItem, SettlementTableMemo } from "~/components/settlement";

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

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (month !== null) {
    console.log(month);
    return null;
  } else {
    console.log("nope");
    return null;
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);

  const monthNumeral = useMemo(() => monthToNumeral(selectedDate ?? new Date()), [selectedDate]);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const newArr = Array(items.length).fill(true);
    setItemsChecked(newArr);
  }, [items]);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(monthToKorean(selectedDate));
    }
  }, [selectedDate]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  return (
    <>
      <SettlementListPage>
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
        <div style={{ height: "20px" }} />
        <SettlementTableMemo
          items={items}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
        />

        <div style={{ height: "20px" }} />
      </SettlementListPage>
    </>
  );
}
