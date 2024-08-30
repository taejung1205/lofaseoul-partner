//수익금계산 페이지에서 사용되는, 한 공급처에서

import { Checkbox } from "@mantine/core";
import { Link } from "@remix-run/react";
import React from "react";
import { useEffect, useMemo, useState } from "react";

//주어진 기간동안 낸 수익 관련 정보를 나타냅니다.
export type PartnerRevenueStat = {
  startDateStr: string; //통계 시작일
  endDateStr: string; //통계 종료일
  partnerName: string; //공급처
  lofaSalesAmount: number; //로파판매액 (할인판매가 기준 자사몰, 쇼룸 매출액)
  otherSalesAmount: number; //외부판매액 (할인판매가 기준 외부플랫폼 매출액)
  totalSalesAmount: number; //총판매액 (로파판매액 + 외부판매액)
  partnerSettlement: number; //업체정산금
  platformFee: number; //플랫폼 요금
  lofaDiscountLevy: number; //로파할인부담금
  proceeds: number; //수익금
  netProfitAfterTax: number; //세후 순수익
  returnRate: number; //수익률
  productCategory: string[]; //상품분류 (다중태그)
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function Box({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    width: "inherit",
    height: "80%",
    minHeight: "80%",
    position: "relative",
    overflow: "scroll",
    ...styleOverrides,
  };

  return (
    <div style={orderBoxStyles} {...props}>
      {children}
    </div>
  );
}

function ItemsBox({ children, styleOverrides, ...props }: Props) {
  const orderItemsBoxStyles: React.CSSProperties = {
    maxHeight: "85%",
  };

  return (
    <div style={orderItemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

function ItemBox({ children, styleOverrides, ...props }: Props) {
  const orderItemBoxStyles: React.CSSProperties = {
    width: "fit-content",
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    ...styleOverrides,
  };

  return (
    <div style={orderItemBoxStyles} {...props}>
      {children}
    </div>
  );
}

function Header({ children, styleOverrides, ...props }: Props) {
  const orderHeaderStyles: React.CSSProperties = {
    backgroundColor: "#ebebeb",
    width: "fit-content",
    display: "flex",
    alignItems: "center",
    padding: "10px 6px",
    ...styleOverrides,
  };

  return (
    <div style={orderHeaderStyles} {...props}>
      {children}
    </div>
  );
}

function TextBox({ children, styleOverrides, ...props }: Props) {
  const textBoxStyles: React.CSSProperties = {
    marginLeft: "10px",
    fontWeight: 700,
    fontSize: "16px",
    lineHeight: "20px",
    textAlign: "center",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    ...styleOverrides,
  };

  return (
    <div style={textBoxStyles} {...props}>
      {children}
    </div>
  );
}

function PartnerRevenueStatItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
  isSum = false,
}: {
  item: PartnerRevenueStat;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
  isSum?: boolean;
}) {
  const [isChecked, setIsChecked] = useState<boolean>(check);

  const productCategoryStr = useMemo(() => {
    return item.productCategory.join(" / ");
  }, [item.productCategory]);

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  return (
    <ItemBox
      key={`PartnerRevenueStatItem-${index}`}
      styleOverrides={{
        borderTop: isSum ? "1px solid black" : "none",
      }}
    >
      {checkboxRequired ? (
        <Checkbox
          color={"gray"}
          size={"sm"}
          checked={isChecked}
          onChange={(event) => {
            setIsChecked(event.currentTarget.checked);
            onItemCheck(index, event.currentTarget.checked);
          }}
        />
      ) : (
        <></>
      )}

      <TextBox styleOverrides={{ minWidth: "240px", width: "240px" }}>
        {isSum ? "합계" : `${item.startDateStr} ~ ${item.endDateStr}`}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
        {item.partnerName}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.lofaSalesAmount).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.otherSalesAmount).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.totalSalesAmount).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.partnerSettlement).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.platformFee).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.lofaDiscountLevy).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.proceeds).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {Math.floor(item.netProfitAfterTax).toLocaleString("ko-KR")}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.returnRate.toFixed(2)}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "270px", width: "360px" }}>
        {productCategoryStr}
      </TextBox>
      {isSum ? (
        <div style={{ minWidth: "120px" }} />
      ) : (
        <Link
          to={`/admin/revenue-db?is-searched=true&start-date=${item.startDateStr}&end-date=${item.endDateStr}&seller=all&partner-name=${item.partnerName}&product-name=&order-status=전체&cs=전체&filter-discount=전체`}
        >
          <TextBox styleOverrides={{ color: "blue" }}>자세히</TextBox>
        </Link>
      )}
    </ItemBox>
  );
}

export function PartnerRevenueStatTable({
  items,
  itemsChecked = [],
  onItemCheck = () => {},
  onCheckAll = () => {},
  defaultAllCheck = true,
  checkboxRequired = true,
}: {
  items: PartnerRevenueStat[];
  itemsChecked?: boolean[];
  onItemCheck?: (index: number, isChecked: boolean) => void;
  onCheckAll?: (isChecked: boolean) => void;
  defaultAllCheck?: boolean;
  checkboxRequired?: boolean;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  const sumItem: PartnerRevenueStat = useMemo(() => {
    const sum: PartnerRevenueStat = {
      startDateStr: "",
      endDateStr: "",
      partnerName: "",
      lofaSalesAmount: 0,
      otherSalesAmount: 0,
      totalSalesAmount: 0,
      partnerSettlement: 0,
      platformFee: 0,
      lofaDiscountLevy: 0,
      proceeds: 0,
      netProfitAfterTax: 0,
      returnRate: 0,
      productCategory: [],
    };

    items.forEach((stat) => {
      sum.lofaSalesAmount += stat.lofaSalesAmount;
      sum.otherSalesAmount += stat.otherSalesAmount;
      sum.totalSalesAmount += stat.totalSalesAmount;
      sum.partnerSettlement += stat.partnerSettlement;
      sum.platformFee += stat.platformFee;
      sum.lofaDiscountLevy += stat.lofaDiscountLevy;
      sum.proceeds += stat.proceeds;
      sum.netProfitAfterTax += stat.netProfitAfterTax;
    });

    sum.returnRate =
      sum.totalSalesAmount != 0
        ? (sum.netProfitAfterTax / sum.totalSalesAmount) * 100
        : 0;

    return sum;
  }, [items]);

  return (
    <>
      <Box>
        <Header>
          {checkboxRequired ? (
            <Checkbox
              color={"gray"}
              size={"sm"}
              checked={allChecked}
              onChange={(event) => {
                const val = event.currentTarget.checked;
                onCheckAll(val);
                setAllChecked(val);
              }}
            />
          ) : (
            <></>
          )}

          <TextBox styleOverrides={{ minWidth: "240px", width: "240px" }}>
            기간
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "180px",
              width: "180px",
            }}
          >
            공급처
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            로파판매액
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            외부판매액
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            총판매액
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            업체정산금
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            플랫폼수수료
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            로파할인부담금
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            수익금
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            세후 순수익
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
            수익률(%)
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "270px", width: "360px" }}>
            상품분류
          </TextBox>
          <div style={{ minWidth: "120px" }} />
        </Header>
        <ItemsBox>
          {items.map((item, index) => {
            return (
              <PartnerRevenueStatItem
                key={`PartnerRevenueStatItem-${index}`}
                index={index}
                item={item}
                check={itemsChecked[index] ?? false}
                onItemCheck={onItemCheck}
                checkboxRequired={checkboxRequired}
              />
            );
          })}
          <PartnerRevenueStatItem
            key={`PartnerRevenueStatItemSum`}
            index={-1}
            item={sumItem}
            check={false}
            onItemCheck={onItemCheck}
            checkboxRequired={checkboxRequired}
            isSum={true}
          />
        </ItemsBox>
      </Box>
    </>
  );
}

export const PartnerRevenueStatTableMemo = React.memo(
  PartnerRevenueStatTable,
  (prev, next) => {
    return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
  }
);
