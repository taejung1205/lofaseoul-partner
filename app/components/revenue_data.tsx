import { Checkbox } from "@mantine/core";
import { useEffect, useState } from "react";

//통계용 파일 업로드에서 올릴 때 사용하는 양식입니다.
export type RevenueDataItem = {
  orderDate: Date; //구매일자
  seller: string; //판매처 (플랫폼)
  partnerName: string; //공급처 (파트너명)
  productName: string; //상품명
  option: string; //옵션명
  price: number; //판매가
  amount: number; //수량
  orderStatus: string; //주문상태
  cs: string; // C/S
  isDiscounted: boolean;
};

interface Props extends  React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}


function OrderBox({ children, styleOverrides, ...props }: Props) {
  const orderBoxStyles: React.CSSProperties = {
    width: 'inherit',
    height: '60%',
    minHeight: '60%',
    position: 'relative',
    overflow: 'scroll',
    ...styleOverrides
  };

  return (
    <div style={orderBoxStyles} {...props}>
      {children}
    </div>
  );
}

function OrderItemsBox({ children, styleOverrides,  ...props }: Props) {
  const orderItemsBoxStyles: React.CSSProperties = {
    maxHeight: '85%',
  };

  return (
    <div style={orderItemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

function OrderItemBox({ children, styleOverrides, ...props }: Props) {
  const orderItemBoxStyles: React.CSSProperties = {
    width: 'fit-content',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 6px',
    ...styleOverrides
  };

  return (
    <div style={orderItemBoxStyles} {...props}>
      {children}
    </div>
  );
}

function OrderHeader({ children, styleOverrides, ...props }: Props) {
  const orderHeaderStyles: React.CSSProperties = {
    backgroundColor: '#ebebeb',
    width: 'fit-content',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 6px',
    ...styleOverrides
  };

  return (
    <div style={orderHeaderStyles} {...props}>
      {children}
    </div>
  );
}

function TextBox({ children, styleOverrides, ...props }: Props) {
  const textBoxStyles: React.CSSProperties = {
    marginLeft: '10px',
    fontWeight: 700,
    fontSize: '16px',
    lineHeight: '20px',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ...styleOverrides
  };

  return (
    <div style={textBoxStyles} {...props}>
      {children}
    </div>
  );
}

/**
 * 엑셀에서 읽어온 해당 수익통계 자료 아이템이 유효한 지를 확인합니다.
 * @param item : RevenueDataItem
 * @returns
 *  유효할 경우 true, 아닐 경우 문제가 있는 곳의 항목명
 */
export function checkRevenueDataItem(item: RevenueDataItem) {
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

  // Check if cs is defined and a non-empty string
  if (item.cs == undefined || item.cs.trim() === "") {
    return { isValid: false, message: "CS가 누락된 항목이 존재합니다." };
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
  item: RevenueDataItem;
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
    <OrderItemBox key={`SettlementItem-${index}`}>
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
        {item.orderDate}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.seller}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}>
        {item.orderNumber}
      </TextBox>
      {isWaybill ? (
        <>
          <TextBox
            styleOverrides={{ minWidth: "160px", fontSize: "16px", width: "160px" }}
          >
            {item.shippingCompany}
          </TextBox>
          <TextBox
            styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
          >
            {item.waybillNumber}
          </TextBox>
        </>
      ) : (
        <></>
      )}
      {isWaybillEdit ? (
        <>
          <ShippingCompanySelect
            shippingCompany={shippingCompany}
            setShippingCompany={(val: string) => {
              setShippingCompany(val);
              onItemShippingCompanySelect(index, val);
            }}
          />
          <input
            style={{
              minWidth: "160px",
              width: "160px",
              marginLeft: "10px",
              fontSize: "12px",
              height: "40px",
            }}
            value={waybillNumber}
            onChange={(e) => {
              setWaybillNumber(e.target.value);
              onItemWaybillNumberEdit(index, e.target.value);
            }}
          />
        </>
      ) : (
        <></>
      )}
      <TextBox styleOverrides={{ minWidth: "450px", fontSize: "12px", width: "450px" }}>
        {item.productName}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "250px", fontSize: "12px", width: "250px" }}>
        {item.optionName}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "30px", width: "30px" }}>
        {item.amount}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "60px", width: "60px" }}>
        {item.zipCode}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "400px", fontSize: "12px", width: "400px" }}>
        {item.address}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "160px", width: "160px" }}>
        {item.phone}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "160px", width: "160px" }}>
        {item.ordererPhone}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.orderer}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.receiver}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.customsCode}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "250px", fontSize: "12px", width: "250px" }}>
        {item.deliveryRequest}
      </TextBox>
    </OrderItemBox>
  );
}