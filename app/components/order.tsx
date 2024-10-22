import { Checkbox } from "@mantine/core";
import React from "react";
import { useEffect, useState } from "react";
import { dayStrToDate } from "~/utils/date";
import { ShippingCompanySelect } from "./shipping_company";

export type OrderItem = {
  seller: string;
  orderNumber: string;
  productName: string;
  optionName: string;
  amount: number;
  zipCode: string;
  address: string;
  phone: string;
  // ordererPhone: string;
  // orderer: string;
  receiver: string;
  customsCode: string;
  deliveryRequest: string;
  managementNumber: string; //관리번호
  shippingCompany: string;
  waybillNumber: string;
  providerName: string;
  orderSharedDate: string; //주문서가 공유된 날짜 XXXX-XX-XX
  waybillSharedDate: string; //운송장이 마지막으로 공유된 날짜 XXXX-XX-XX
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  styleOverrides?: React.CSSProperties;
}

function OrderBox({ children, styleOverrides, ...props }: Props) {
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

function OrderItemsBox({ children, styleOverrides, ...props }: Props) {
  const orderItemsBoxStyles: React.CSSProperties = {
    maxHeight: "85%",
  };

  return (
    <div style={orderItemsBoxStyles} {...props}>
      {children}
    </div>
  );
}

function OrderItemBox({ children, styleOverrides, ...props }: Props) {
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

function OrderHeader({ children, styleOverrides, ...props }: Props) {
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
 * 엑셀에서 읽어온 해당 주문서 아이템이 유효한 지를 확인합니다.
 * 옵션명, 파트너명, 송장번호, 통관부호, 배송요청사항,
 * 배송사번호, 운송장 공유 일자를 제외하고 비어있는 값이 있으면 유효하지 않은 값으로 간주합니다.
 * @param item : OrderItem
 * @returns
 *  유효할 경우 'ok', 아닐 경우 오류사유
 */
export function isOrderItemValid(item: OrderItem): string {
  if (item.seller == undefined || item.seller == "") {
    return "판매처가 누락되었습니다.";
  }

  if (item.orderNumber == undefined || item.orderNumber == "") {
    return "주문번호가 누락되었습니다.";
  }

  if (item.productName == undefined || item.productName == "") {
    return "상품명이 누락되었습니다.";
  }

  if (item.amount == undefined) {
    return "수량이 누락되었습니다.";
  }

  if (item.zipCode == undefined || item.zipCode == "") {
    return "우편번호가 누락되었습니다.";
  }

  if (item.address == undefined || item.address == "") {
    return "주소가 누락되었습니다.";
  }

  if (item.phone == undefined || item.phone == "") {
    return "연락처가 누락되었습니다.";
  }

  if (item.providerName == undefined || item.providerName == "") {
    return "공급처명이 누락되었습니다.";
  }

  if (item.receiver == undefined || item.receiver == "") {
    return "수취인이 누락되었습니다.";
  }

  if (item.managementNumber == undefined || item.managementNumber == "") {
    return "관리번호가 누락되었습니다.";
  }

  return "ok";
}

function OrderItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
  isWaybill = false,
  isWaybillEdit = false,
  isDelayedOrder = false,
  onItemShippingCompanySelect = (index: number, company: string) => {},
  onItemWaybillNumberEdit = (index: number, number: string) => {},
}: {
  item: OrderItem;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
  isWaybill: boolean;
  isWaybillEdit: boolean;
  isDelayedOrder: boolean;
  onItemShippingCompanySelect?: (
    index: number,
    shippingCompany: string
  ) => void;
  onItemWaybillNumberEdit?: (index: number, waybillNumber: string) => void;
}) {
  const [isChecked, setIsChecked] = useState<boolean>(check);
  const [shippingCompany, setShippingCompany] = useState<string>(
    item.shippingCompany
  );
  const [waybillNumber, setWaybillNumber] = useState<string>(
    item.waybillNumber
  );

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  useEffect(() => {
    setShippingCompany(item.shippingCompany);
    setWaybillNumber(item.waybillNumber);
  }, [item]);

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

      {isDelayedOrder ? (
        <>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              fontSize: "16px",
              width: "160px",
            }}
          >
            {item.orderSharedDate}
          </TextBox>
          <TextBox
            styleOverrides={{ minWidth: "80px", width: "80px", color: "red" }}
          >
            {`+${Math.floor(
              (new Date().getTime() -
                dayStrToDate(item.orderSharedDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )}`}
          </TextBox>
        </>
      ) : (
        <></>
      )}
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.managementNumber}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.seller}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "160px", fontSize: "12px", width: "160px" }}
      >
        {item.orderNumber}
      </TextBox>
      {isWaybill ? (
        <>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              fontSize: "16px",
              width: "160px",
            }}
          >
            {item.shippingCompany}
          </TextBox>
          <TextBox
            styleOverrides={{
              minWidth: "160px",
              fontSize: "12px",
              width: "160px",
            }}
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
      <TextBox styleOverrides={{ minWidth: "150px", width: "150px" }}>
        {item.providerName}
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
      <TextBox styleOverrides={{ minWidth: "40px", width: "40px" }}>
        {item.amount}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.zipCode}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "400px", fontSize: "12px", width: "400px" }}
      >
        {item.address}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "160px", width: "160px" }}>
        {item.phone}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.receiver}
      </TextBox>
      <TextBox styleOverrides={{ minWidth: "90px", width: "90px" }}>
        {item.customsCode}
      </TextBox>
      <TextBox
        styleOverrides={{ minWidth: "250px", fontSize: "12px", width: "250px" }}
      >
        {item.deliveryRequest}
      </TextBox>
    </OrderItemBox>
  );
}

export function OrderTable({
  items,
  itemsChecked,
  onItemCheck,
  onCheckAll,
  defaultAllCheck = true,
  checkboxRequired = true,
  isWaybillEdit = false,
  isWaybill = false,
  isDelayedOrder = false,
  onItemShippingCompanySelect,
  onItemWaybillNumberEdit,
}: {
  items: OrderItem[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
  checkboxRequired?: boolean;
  isWaybillEdit?: boolean;
  isWaybill?: boolean;
  isDelayedOrder?: boolean;
  onItemShippingCompanySelect?: (
    index: number,
    shippingCompany: string
  ) => void;
  onItemWaybillNumberEdit?: (index: number, waybillNumber: string) => void;
}) {
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setAllChecked(defaultAllCheck);
  }, [items]);

  return (
    <>
      <OrderBox>
        <OrderHeader>
          {checkboxRequired ? (
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
          ) : (
            <></>
          )}

          {isDelayedOrder ? (
            <>
              <TextBox styleOverrides={{ minWidth: "160px" }}>
                주문공유 날짜
              </TextBox>
              <TextBox styleOverrides={{ minWidth: "80px" }}>지연일</TextBox>
            </>
          ) : (
            <></>
          )}
          <TextBox styleOverrides={{ minWidth: "90px" }}>
            관리번호<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px" }}>
            판매처<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "160px" }}>
            주문번호<span style={{ color: "red" }}>*</span>
          </TextBox>

          {isWaybillEdit || isWaybill ? (
            <>
              <TextBox styleOverrides={{ minWidth: "160px" }}>택배사</TextBox>
              <TextBox styleOverrides={{ minWidth: "160px" }}>송장번호</TextBox>
            </>
          ) : (
            <></>
          )}

          <TextBox styleOverrides={{ minWidth: "150px" }}>
            공급처명<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "450px" }}>
            상품명<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "250px" }}>옵션명</TextBox>
          <TextBox styleOverrides={{ minWidth: "40px" }}>
            수량<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px" }}>
            우편번호<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "400px" }}>
            주소<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "160px" }}>
            연락처<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px" }}>
            수취인<span style={{ color: "red" }}>*</span>
          </TextBox>
          <TextBox styleOverrides={{ minWidth: "90px" }}>통관부호</TextBox>
          <TextBox styleOverrides={{ minWidth: "250px" }}>배송요청사항</TextBox>
          <div style={{ width: "16px" }} />
        </OrderHeader>
        <OrderItemsBox>
          {items.map((item, index) => {
            return (
              <OrderItem
                key={`OrderItem-${index}`}
                index={index}
                item={item}
                check={itemsChecked[index] ?? false}
                onItemCheck={onItemCheck}
                checkboxRequired={checkboxRequired}
                isWaybill={isWaybill}
                isWaybillEdit={isWaybillEdit}
                isDelayedOrder={isDelayedOrder}
                onItemShippingCompanySelect={onItemShippingCompanySelect}
                onItemWaybillNumberEdit={onItemWaybillNumberEdit}
              />
            );
          })}
        </OrderItemsBox>
      </OrderBox>
    </>
  );
}

export const OrderTableMemo = React.memo(OrderTable, (prev, next) => {
  return prev.items == next.items && prev.itemsChecked == next.itemsChecked;
});
