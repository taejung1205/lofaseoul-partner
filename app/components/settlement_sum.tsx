import { Link } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { PossibleSellers } from "./seller";
import { Checkbox, Space } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { isMobile } from "~/utils/mobile";

export type SettlementSumItem = {
  partnerName: string;
  data: any;
  brn: string;
  bankAccount: string;
};

export function SettlementBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    width: "inherit",
    height: "60%",
    minHeight: "60%",
    position: "relative",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementItemsBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const itemsBoxStyles: React.CSSProperties = {
    maxHeight: "85%",
    overflowY: "scroll",
  };

  return (
    <div style={itemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementItemBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const itemBoxStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ebebeb4d",
    padding: "10px",
    marginTop: "8px",
    lineHeight: 1,
  };

  return (
    <div style={itemBoxStyles} {...props}>
      {children}
    </div>
  );
}

export function SettlementHeader({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ebebeb",
    padding: "10px",
    marginTop: "8px",
    lineHeight: 1,
  };

  return (
    <div style={headerStyles} {...props}>
      {children}
    </div>
  );
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

export function TextBox({ children, styleOverrides, ...props }: Props) {
  const textBoxStyles: React.CSSProperties = {
    marginLeft: "10px",
    fontWeight: 700,
    fontSize: "16px",
    lineHeight: "16px",
    textAlign: "center",
    ...styleOverrides,
  };

  return (
    <div style={textBoxStyles} {...props}>
      {children}
    </div>
  );
}

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
  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

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
        flexDirection: isMobileMemo ? "column" : "row",
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
      <Space h={15} />
      <div
        style={{
          display: "flex",
          fontSize: "16px",
          fontWeight: "700",
          alignItems: isMobileMemo ? "start" : "center",
          textAlign: "center",
          flexDirection: isMobileMemo ? "column" : "row",
        }}
      >
        정산 금액
        <Space w={15} h={10} />
        <div style={{ color: "#1859FF" }}>
          {" "}
          {`${settlement.toLocaleString()}원`}
        </div>
        <Space w={25} h={15} />
        배송비 별도 정산
        <Space w={15} h={10} />
        <div style={{ color: "#1859FF" }}>
          {" "}
          {`${shippingFee.toLocaleString()}원`}
        </div>
        <Space w={25} h={15} />
        정산 총계 (정산 금액 + 배송비)
        <Space w={15} h={10} />
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
        <TextBox styleOverrides={{ width: "18%", textAlign: "left" }}>업체명</TextBox>
        <TextBox styleOverrides={{ width: "14%" }}>사업자등록번호</TextBox>
        <TextBox styleOverrides={{ width: "14%" }}>계좌번호</TextBox>
        <TextBox styleOverrides={{ width: "14%" }}>정산금액</TextBox>
        <TextBox styleOverrides={{ width: "14%" }}>배송비 별도 정산</TextBox>
        <TextBox styleOverrides={{ width: "14%" }}>최종 정산 금액</TextBox>
        <TextBox styleOverrides={{ width: "10%" }}></TextBox>
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
      <TextBox styleOverrides={{ width: "18%", textAlign: "left" }}>
        {item.partnerName}
      </TextBox>
      <TextBox styleOverrides={{ width: "14%" }}>{item.brn}</TextBox>
      <TextBox styleOverrides={{ width: "14%" }}>{item.bankAccount}</TextBox>
      <TextBox styleOverrides={{ width: "14%" }}>
        {isAllSum ? allSettlement : item.data[`settlement_${seller}`]}
      </TextBox>
      <TextBox styleOverrides={{ width: "14%" }}>
        {isAllSum ? allShipping : item.data[`shipping_${seller}`]}
      </TextBox>
      <TextBox styleOverrides={{ width: "14%" }}>
        {isAllSum
          ? allShipping + allSettlement
          : item.data[`settlement_${seller}`] + item.data[`shipping_${seller}`]}
      </TextBox>
      <Link
        to={`/admin/settlement-manage-detail?partner=${item.partnerName}&month=${numeralMonth}`}
        style={{ width: "10%" }}
      >
        <TextBox styleOverrides={{ color: "#1859FF" }}>자세히보기</TextBox>
      </Link>
    </SettlementItemBox>
  );
}
