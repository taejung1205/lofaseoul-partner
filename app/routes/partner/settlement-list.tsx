import { LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  monthToKorean,
  MonthSelectPopover,
  monthToNumeral,
  numeralMonthToKorean,
} from "~/components/date";
import { SettlementItem, SettlementTableMemo } from "~/components/settlement";
import authenticator from "~/services/auth.server";
import { getSettlements } from "~/services/firebase.server";

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
    return settlements;
  } else {
    return null;
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const settlements: SettlementItem[] | null = useLoaderData(); //Partner Profile List

  const monthNumeral = useMemo(
    () => monthToNumeral(selectedDate ?? new Date()),
    [selectedDate]
  );

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const newArr = Array(settlements?.length ?? 0).fill(true);
    setItemsChecked(newArr);
  }, [settlements]);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(monthToKorean(selectedDate));
    }
  }, [selectedDate]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(settlements?.length ?? 0).fill(isChecked));
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
        ) : settlements?.length > 0 ? (
          <SettlementTableMemo
            items={settlements}
            itemsChecked={itemsChecked}
            onItemCheck={onItemCheck}
            onCheckAll={onCheckAll}
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

        <div style={{ height: "20px" }} />
      </SettlementListPage>
    </>
  );
}
