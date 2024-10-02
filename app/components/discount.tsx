import { Checkbox } from "@mantine/core";
import React from "react";
import { useEffect, useState } from "react";
import { dateToDayStr } from "~/utils/date";

//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
//한 데이터는 한 거래를 나타냅니다.
export type DiscountData = {
  startDate: Date; //할인 시작일
  endDate: Date; //할인 종료일
  providerName: string; //공급처 (파트너명)
  seller: string; //판매처
  productName: string; //상품명
  partnerDiscountLevyRate: number; //업체부담할인율
  lofaDiscountLevyRate: number; //로파부담할인율
  platformDiscountLevyRate: number; //플랫폼부담할인율
  lofaAdjustmentFeeRate: number; //로파조정수수료율
  platformAdjustmentFeeRate: number; //플랫폼조정수수료율
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function Box({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    height: "60%",
    minHeight: "60%",
    position: "relative",
    overflow: "scroll",
    width: "inherit",
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
 * 엑셀에서 읽어온 해당 할인내역 아이템이 유효한 지를 확인합니다.
 * 부담할인율, 조정수수료율은 공백일 경우 0으로 인식하도록 사전조치되기에
 * 따로 검사하지 않습니다.
 * @param item : DiscountData
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkDiscountData(item: DiscountData) {
  // Check if startDate is defined and not a NaN Date
  if (!(item.startDate instanceof Date) || isNaN(item.startDate.getTime())) {
    //문자열로 들어왔을 가능성 확인
    const date = new Date(item.startDate);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return {
        isValid: false,
        message: `시작일이 유효하지 않은 항목이 존재합니다. (${item.startDate}) `,
      };
    } else {
      item.startDate = date;
    }
  }

  // Check if endDate is defined and not a NaN Date
  if (!(item.endDate instanceof Date) || isNaN(item.endDate.getTime())) {
    //문자열로 들어왔을 가능성 확인
    const date = new Date(item.endDate);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return {
        isValid: false,
        message: `종료일이 유효하지 않은 항목이 존재합니다. (${item.endDate}) `,
      };
    } else {
      item.endDate = date;
    }
  }

  // 시작일은 종료일보다 앞이여야 함
  if (item.startDate > item.endDate) {
    return {
      isValid: false,
      message: `시작일이 종료일보다 앞이여야 합니다.`,
    };
  }

  // Check if seller is defined and a non-empty string
  if (item.seller == undefined || item.seller.trim() === "") {
    return { isValid: false, message: "판매처가 누락된 항목이 존재합니다." };
  }

  // Check if providerName is defined and a non-empty string
  if (item.providerName == undefined || item.providerName.trim() === "") {
    return { isValid: false, message: "공급처가 누락된 항목이 존재합니다." };
  }

  // Check if productName is defined and a non-empty string
  if (item.productName == undefined || item.productName.trim() === "") {
    return { isValid: false, message: "상품명이 누락된 항목이 존재합니다." };
  }

  // If all checks passed, the item is valid
  return { isValid: true, message: "ok" };
}

function DiscountDataItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
}: {
  item: DiscountData;
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
    <ItemBox key={`DiscountDataItem-${index}`}>
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
        {dateToDayStr(item.startDate)}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {dateToDayStr(item.endDate)}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
      >
        {item.seller}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
      >
        {item.providerName}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "420px", fontSize: "12px", width: "420px" }}
      >
        {item.productName}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.partnerDiscountLevyRate}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.lofaDiscountLevyRate}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.platformDiscountLevyRate}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.lofaAdjustmentFeeRate}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "120px", width: "120px" }}>
        {item.platformAdjustmentFeeRate}
      </TextBox>
    </ItemBox>
  );
}

export function DiscountDataTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
  checkboxRequired = true,
}: {
  items: DiscountData[];
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
            할인시작일<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
            할인종료일<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              width: "160px",
            }}
          >
            판매처<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              width: "160px",
            }}
          >
            공급처<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "420px",
              width: "420px",
            }}
          >
            상품명<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "120px",
              width: "120px",
              fontSize: "14px",
            }}
          >
            업체부담할인율
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "120px",
              width: "120px",
              fontSize: "14px",
            }}
          >
            로파부담할인율
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "120px",
              width: "120px",
              fontSize: "14px",
            }}
          >
            플랫폼부담할인율
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "120px",
              width: "120px",
              fontSize: "14px",
            }}
          >
            로파조정수수료율
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "120px",
              width: "120px",
              fontSize: "14px",
            }}
          >
            플랫폼조정수수료율
          </TextBox>
          <div style={{ width: "16px" }} />
        </Header>
        <ItemsBox>
          {items.map((item, index) => {
            return (
              <DiscountDataItem
                key={`DiscountDataItem-${index}`}
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

export const DiscountDataTableMemo = React.memo(
  DiscountDataTable,
  (prev, next) => {
    return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
  }
);
