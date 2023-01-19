import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
    monthToKorean,
    MonthSelectPopover,
    monthToNumeral,
    numeralMonthToKorean,
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
import {
    getPartnerProfile,
    getSettlements,
    getSettlementSum,
} from "~/services/firebase.server";

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

const InputBox = styled.input`
  width: 140px;
  height: 40px;
  border: 3px solid black;
  padding: 6px;
  text-align: left;
  font-size: 20px;
  font-weight: 700;
  margin-left: 20px;
  ::placeholder {
    color: black;
    font-weight: 700;
    opacity: 1;
  }
  :focus::placeholder {
    color: transparent;
  }
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");
  if (month !== null && partnerName !== null) {
    const monthStr = numeralMonthToKorean(month);
    const checkPartner = await getPartnerProfile({ name: partnerName });
    if (checkPartner == null) {
      return json({ error: "partner", partnerName: partnerName });
    }
    const settlements = await getSettlements({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    const sums = await getSettlementSum({
      partnerName: partnerName,
      monthStr: monthStr,
    });

    return json({
      settlements: settlements,
      sums: sums,
      partnerName: partnerName,
    });
  } else if (month !== null) {
    return json({ error: "partner null" });
  } else {
    return json({ error: "month null", partnerName: partnerName });
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [seller, setSeller] = useState<string>("all");
  const [partnerName, setPartnerName] = useState<string>();
  const loaderData = useLoaderData();

  const monthNumeral = useMemo(
    () => monthToNumeral(selectedDate ?? new Date()),
    [selectedDate]
  );

  const settlements: SettlementItem[] | null = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.settlements;
    }
  }, [loaderData]);

  const sums = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const errorStr = useMemo(() => {
    if (loaderData.error == undefined) {
      return null;
    }

    switch (loaderData.error) {
      case "partner":
        if (
          loaderData.partnerName == undefined ||
          loaderData.partnerName == "undefined"
        ) {
          return `파트너 정보가 잘못되었습니다. 다시 조회해주세요. `;
        } else {
          return `파트너명(${loaderData.partnerName})이 유효하지 않습니다.`;
        }
      case "partner null":
        return `파트너 정보가 잘못되었습니다. 다시 조회해주세요. `;
      case "partner null":
        return `날짜 정보가 잘못되었습니다. 다시 조회해주세요. `;
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

  useEffect(() => {
    if (
      loaderData.partnerName !== undefined &&
      loaderData.partnerName !== "undefined"
    ) {
      setPartnerName(loaderData.partnerName);
    } else {
      setPartnerName("");
    }
  }, [loaderData]);

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
            <InputBox
              type="text"
              name="name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Link
              to={`/admin/settlement-manage-detail?month=${monthNumeral}&partner=${partnerName}`}
            >
              <GetListButton type="submit">조회하기</GetListButton>
            </Link>
          </div>

          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.error == undefined ? (
          <SettlementTableMemo
            items={items}
            itemsChecked={itemsChecked}
            onItemCheck={onItemCheck}
            onCheckAll={onCheckAll}
            defaultAllCheck={false}
          />
        ) : (
          <EmptySettlementBox>{errorStr}</EmptySettlementBox>
        )}
        {items.length > 0 && allSum !== null ? (
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
