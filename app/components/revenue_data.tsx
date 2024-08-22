import { Checkbox } from "@mantine/core";
import React from "react";
import { useEffect, useState } from "react";
import { dateToDayStr } from "~/utils/date";

//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
//한 데이터는 한 거래를 나타냅니다.
export type RevenueData = {
  orderDate: Date; //구매일자
  seller: string; //판매처 (플랫폼)
  partnerName: string; //공급처 (파트너명)
  productName: string; //상품명
  optionName: string; //옵션명
  price: number; //판매가
  amount: number; //수량
  orderStatus: string; //주문상태
  cs: string; // C/S
  isDiscounted: boolean;
  lofaDiscountLevyRate?: number;
  partnerDiscountLevyRate?: number;
  platformDiscountLevyRate?: number;
  lofaAdjustmentFeeRate?: number;
  platformAdjustmentFeeRate?: number; 
};

export const PossibleOrderStatus = ["발주", "접수", "송장", "배송"];

export const PossibleCS = [
  "정상",
  "배송전 부분 교환",
  "배송전 부분 취소",
  "배송전 전체 취소",
  "배송전 전체 교환",
  "배송후 부분 교환",
  "배송후 부분 취소",
  "배송후 전체 취소",
  "배송후 전체 교환",
  "보류",
  "맞교환",
  "배송후교환C",
];

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function Box({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    width: "inherit",
    height: "60%",
    minHeight: "60%",
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

/**
 * 엑셀에서 읽어온 해당 수익통계 자료 아이템이 유효한 지를 확인합니다.
 * 상태와 CS의 경우 가능한 항목으로 적혔는지 확인합니다.
 * @param item : RevenueDataItem
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkRevenueDataItem(item: RevenueData) {
  // Check if orderDate is defined and a non-empty string
  if (!(item.orderDate instanceof Date) || isNaN(item.orderDate.getTime())) {
    return {
      isValid: false,
      message: `주문일이 유효하지 않은 항목이 존재합니다. (${item.orderDate}) `,
    };
  }

  // Check if seller is defined and a non-empty string
  if (item.seller == undefined || item.seller.trim() === "") {
    return { isValid: false, message: "판매처가 누락된 항목이 존재합니다." };
  }

  // Check if partnerName is defined and a non-empty string
  if (item.partnerName == undefined || item.partnerName.trim() === "") {
    return { isValid: false, message: "공급처가 누락된 항목이 존재합니다." };
  }

  // Check if productName is defined and a non-empty string
  if (item.productName == undefined || item.productName.trim() === "") {
    return { isValid: false, message: "상품명이 누락된 항목이 존재합니다." };
  }

  // Check if price is defined, a number, and positive
  if (item.price == undefined || Number.isNaN(item.price)) {
    return { isValid: false, message: "판매가가 누락된 항목이 존재합니다." };
  }

  // Check if amount is defined, an integer, and positive
  if (item.amount == undefined || !Number.isInteger(item.amount)) {
    return { isValid: false, message: "주문수량이 누락된 항목이 존재합니다." };
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

function RevenueDataItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
}: {
  item: RevenueData;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
}) {
  const [isChecked, setIsChecked] = useState<boolean>(check);

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  return (
    <ItemBox key={`RevenueDataItem-${index}`}>
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

      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {dateToDayStr(item.orderDate)}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.seller}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
      >
        {item.partnerName}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "450px", fontSize: "12px", width: "450px" }}
      >
        {item.productName}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "250px", fontSize: "12px", width: "250px" }}
      >
        {item.optionName}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.price}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.amount}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.orderStatus}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
        {item.cs}
      </TextBox>
    </ItemBox>
  );
}

export function RevenueDataTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
  checkboxRequired = true,
}: {
  items: RevenueData[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
  checkboxRequired?: boolean;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
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

          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            주문일
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            판매처
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              fontSize: "12px",
              width: "160px",
            }}
          >
            공급처
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "450px",
              fontSize: "12px",
              width: "450px",
            }}
          >
            상품명
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "250px",
              fontSize: "12px",
              width: "250px",
            }}
          >
            옵션명
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            판매가
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            주문수량
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            상태
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "180px", width: "180px" }}>
            CS
          </TextBox>
          <div style={{ width: "16px" }} />
        </Header>
        <ItemsBox>
          {items.map((item, index) => {
            return (
              <RevenueDataItem
                key={`RevenueDataItem-${index}`}
                index={index}
                item={item}
                check={itemsChecked[index] ?? false}
                onItemCheck={onItemCheck}
                checkboxRequired={checkboxRequired}
              />
            );
          })}
        </ItemsBox>
      </Box>
    </>
  );
}

export const RevenueDataTableMemo = React.memo(
  RevenueDataTable,
  (prev, next) => {
    return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
  }
);
