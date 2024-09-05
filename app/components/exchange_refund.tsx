//교환/환불 내역 등록을 위한 컴포넌트를 정리합니다.

import { useEffect, useState } from "react";
import { PossibleCS, PossibleOrderStatus } from "./revenue_data";
import { Checkbox } from "@mantine/core";
import React from "react";

export type ExchangeRefundData = {
  orderNumber: string;
  productName: string;
  orderStatus: string;
  cs: string;
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function Box({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    maxWidth: "100%",
    height: "55%",
    minHeight: "55%",
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
    fontSize: "10px",
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

/**
 * 엑셀에서 읽어온 해당 수익통계 자료 아이템이 유효한 지를 확인합니다.
 * 상태와 CS의 경우 가능한 항목으로 적혔는지 확인합니다.
 * @param item : RevenueDataItem
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkExchangeRefundData(item: ExchangeRefundData) {
  // Check if seller is defined and a non-empty string
  if (item.orderNumber == undefined || item.orderNumber.trim() === "") {
    return { isValid: false, message: "주문번호가 누락된 항목이 존재합니다." };
  }

  // Check if orderStatus is defined and a non-empty string
  if (item.orderStatus == undefined || item.orderStatus.trim() === "") {
    return { isValid: false, message: "상태가 누락된 항목이 존재합니다." };
  }

  if (!PossibleOrderStatus.includes(item.orderStatus)) {
    return {
      isValid: false,
      message: `상태가 유효하지 않은 항목이 존재합니다. (${item.orderStatus})`,
    };
  }

  // Check if cs is defined and a non-empty string
  if (item.cs == undefined || item.cs.trim() === "") {
    return { isValid: false, message: "CS가 누락된 항목이 존재합니다." };
  }

  if (!PossibleCS.includes(item.cs)) {
    return {
      isValid: false,
      message: `CS가 유효하지 않은 항목이 존재합니다. (${item.cs})`,
    };
  }

  // If all checks passed, the item is valid
  return { isValid: true, message: "ok" };
}

function ExchangeRefundItemComponent({
  item,
  index,
  check,
  onItemCheck,
}: {
  item: ExchangeRefundData;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
}) {
  useEffect(() => {
    setIsChecked(check);
  }, [check]);
  const [isChecked, setIsChecked] = useState<boolean>(check);

  return (
    <ItemBox key={`ExchangeRefundItem-${index}`}>
      <Checkbox
        color={"gray"}
        size={"sm"}
        checked={isChecked}
        onChange={(event) => {
          setIsChecked(event.currentTarget.checked);
          onItemCheck(index, event.currentTarget.checked);
        }}
      />
      <TextBox styleOverrides={{ width: "150px", minWidth: "150px" }}>
        {item.orderNumber}
      </TextBox>
      <TextBox styleOverrides={{ width: "400px", minWidth: "400px" }}>
        {item.productName}
      </TextBox>
      <TextBox styleOverrides={{ width: "90px", minWidth: "90px" }}>
        {item.orderStatus}
      </TextBox>
      <TextBox styleOverrides={{ width: "90px", minWidth: "90px" }}>
        {item.cs}
      </TextBox>
    </ItemBox>
  );
}

export function ExchangeRefundTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
}: {
  items: ExchangeRefundData[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);
  useEffect(() => {
    console.log(items);
    setAllChecked(defaultAllCheck);
  }, [items]);

  return (
    <Box>
      <Header>
        <Checkbox
          color={"gray"}
          size={"sm"}
          checked={allChecked}
          onChange={(event) => {
            const val = event.currentTarget.checked;
            setAllChecked(val);
            onCheckAll(val);
          }}
        />
        <TextBox styleOverrides={{ width: "150px", minWidth: "150px" }}>
          {"주문번호"}
        </TextBox>
        <TextBox styleOverrides={{ width: "400px", minWidth: "400px" }}>
          {"상품명"}
        </TextBox>
        <TextBox styleOverrides={{ width: "90px", minWidth: "90px" }}>
          {"상태"}
        </TextBox>
        <TextBox styleOverrides={{ width: "90px", minWidth: "90px" }}>
          {"CS"}
        </TextBox>
      </Header>
      <ItemsBox>
        {items.map((item, index) => {
          return (
            <ExchangeRefundItemComponent
              index={index}
              item={item}
              check={itemsChecked[index] ?? false}
              onItemCheck={onItemCheck}
            />
          );
        })}
      </ItemsBox>
    </Box>
  );
}

export const ExchangeRefundTableMemo = React.memo(
  ExchangeRefundTable,
  (prev, next) => {
    return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
  }
);
