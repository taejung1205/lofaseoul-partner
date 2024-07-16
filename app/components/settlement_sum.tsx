import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { PossibleSellers } from "./seller";
import { Checkbox } from "@mantine/core";

export type SettlementSumItem = {
  partnerName: string;
  data: any;
  brn: string;
  bankAccount: string;
};

const SettlementBox = styled.div`
  width: inherit;
  height: 60%;
  min-height: 60%;
  position: relative;
`;

const SettlementItemsBox = styled.div`
  max-height: 85%;
  overflow-y: scroll;
`;

const SettlementItemBox = styled.div`
  display: flex;
  align-items: center;
  background-color: #ebebeb4d;
  padding: 10px;
  margin-top: 8px;
  line-height: 1;
`;

const SettlementHeader = styled(SettlementItemBox)`
  background-color: #ebebeb;
`;

const TextBox = styled.div`
  margin-left: 10px;
  font-weight: 700;
  font-size: 16px;
  line-height: 16px;
  text-align: center;
`;


/**
 * 모든 판매처의 정산금액을 합친 금액을 계산합니다.
 *  @param item : getSettlementSum()으로 가져온 json
 * @return 모든 판매처 정산금액의 합 ({settlement: number, shippingFee: number})
 */
export function getAllSellerSettlementSum(sums: any) {
  let settlement = 0;
  let shippingFee = 0;
  PossibleSellers.forEach((seller) => {
    if (sums[`settlement_${seller}`]) {
      settlement += sums[`settlement_${seller}`];
    }
    if (sums[`shipping_${seller}`]) {
      shippingFee += sums[`shipping_${seller}`];
    }
  });
  settlement += sums[`settlement_etc`];
  shippingFee += sums[`shipping_etc`];
  return { settlement: settlement, shippingFee: shippingFee };
}

export function SettlementSumBar({
  seller,
  settlement,
  shippingFee,
}: {
  seller: string;
  settlement: number;
  shippingFee: number;
}) {
  const [sellerStr, setSellerStr] = useState<string>("");

  useEffect(() => {
    if (seller == "all") {
      setSellerStr("전체 판매처 합계");
    } else if (seller == "etc") {
      setSellerStr("기타 판매처 합계");
    } else if (seller == "로파공홈") {
      setSellerStr("로파 홈페이지 합계");
    } else {
      setSellerStr(`${seller} 합계`);
    }
  }, [seller]);
  return (
    <div
      style={{
        backgroundColor: "#D9D9D999",
        width: "inherit",
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontWeight: "700",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {sellerStr}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "16px",
          fontWeight: "700",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        정산 금액
        <div style={{ width: "15px" }} />
        <div style={{ color: "#1859FF" }}>
          {" "}
          {`${settlement.toLocaleString()}원`}
        </div>
        <div style={{ width: "25px" }} />
        배송비 별도 정산
        <div style={{ width: "15px" }} />
        <div style={{ color: "#1859FF" }}>
          {" "}
          {`${shippingFee.toLocaleString()}원`}
        </div>
        <div style={{ width: "25px" }} />
        정산 총계 (정산 금액 + 배송비)
        <div style={{ width: "15px" }} />
        <div style={{ color: "#1859FF" }}>
          {`${(settlement + shippingFee).toLocaleString()}원`}
        </div>
      </div>
    </div>
  );
}

export function SettlementSumTable({
  items,
  seller,
  numeralMonth,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = false,
}: {
  items: SettlementSumItem[];
  seller: string;
  numeralMonth: string;
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
}) {
  const [isAllSum, setIsAllSum] = useState<boolean>(false);
  useEffect(() => {
    setIsAllSum(seller == "all");
  }, [seller]);

  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  return (
    <SettlementBox>
      <SettlementHeader>
        <Checkbox
          checked={allChecked}
          onChange={(event) => {
            const val = event.currentTarget.checked;
            setAllChecked(val);
            onCheckAll(val);
          }}
        />
        <TextBox style={{ width: "18%", textAlign: "left" }}>업체명</TextBox>
        <TextBox style={{ width: "14%" }}>사업자등록번호</TextBox>
        <TextBox style={{ width: "14%" }}>계좌번호</TextBox>
        <TextBox style={{ width: "14%" }}>정산금액</TextBox>
        <TextBox style={{ width: "14%" }}>배송비 별도 정산</TextBox>
        <TextBox style={{ width: "14%" }}>최종 정산 금액</TextBox>
        <TextBox style={{ width: "10%" }}></TextBox>
        <div style={{ width: "16px" }} />
      </SettlementHeader>
      <SettlementItemsBox>
        {items.map((item: SettlementSumItem, index: number) => {
          return (
            <SettlementSumItem
              item={item}
              index={index}
              check={itemsChecked[index] ?? false}
              onItemCheck={onItemCheck}
              isAllSum={isAllSum}
              seller={seller}
              numeralMonth={numeralMonth}
            />
          );
        })}
      </SettlementItemsBox>
    </SettlementBox>
  );
}

function SettlementSumItem({
  item,
  index,
  check,
  isAllSum,
  seller,
  onItemCheck,
  numeralMonth,
}: {
  item: SettlementSumItem;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  isAllSum: boolean;
  seller: string;
  numeralMonth: string;
}) {
  let allSettlement = 0;
  let allShipping = 0;
  if (isAllSum) {
    const sum = getAllSellerSettlementSum(item.data);
    allSettlement = sum.settlement;
    allShipping = sum.shippingFee;
  }
  useEffect(() => {
    setIsChecked(check);
  }, [check]);
  const [isChecked, setIsChecked] = useState<boolean>(check);
  return (
    <SettlementItemBox key={`SettlementSumItem-${index}`}>
      <Checkbox
        checked={isChecked}
        onChange={(event) => {
          setIsChecked(event.currentTarget.checked);
          onItemCheck(index, event.currentTarget.checked);
        }}
      />
      <TextBox style={{ width: "18%", textAlign: "left" }}>
        {item.partnerName}
      </TextBox>
      <TextBox style={{ width: "14%" }}>{item.brn}</TextBox>
      <TextBox style={{ width: "14%" }}>{item.bankAccount}</TextBox>
      <TextBox style={{ width: "14%" }}>
        {isAllSum ? allSettlement : item.data[`settlement_${seller}`]}
      </TextBox>
      <TextBox style={{ width: "14%" }}>
        {isAllSum ? allShipping : item.data[`shipping_${seller}`]}
      </TextBox>
      <TextBox style={{ width: "14%" }}>
        {isAllSum
          ? allShipping + allSettlement
          : item.data[`settlement_${seller}`] + item.data[`shipping_${seller}`]}
      </TextBox>
      <Link
        to={`/admin/settlement-manage-detail?partner=${item.partnerName}&month=${numeralMonth}`}
        style={{ width: "10%" }}
      >
        <TextBox style={{ color: "#1859FF" }}>자세히보기</TextBox>
      </Link>
    </SettlementItemBox>
  );
}
