import { Checkbox } from "@mantine/core";
import React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { PossibleSellers } from "./seller";
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
  ordererPhone: string;
  orderer: string;
  receiver: string;
  customsCode: string;
  deliveryRequest: string;
  managementNumber: string; //관리번호
  shippingCompany: string;
  waybillNumber: string;
  partnerName: string;
  waybillSharedDate: string; //운송장이 마지막으로 공유된 날짜 XXXX-XX-XX
};

const OrderBox = styled.div`
  width: inherit;
  height: 60%;
  min-height: 60%;
  position: relative;
  overflow: scroll;
`;

const OrderItemsBox = styled.div`
  max-height: 85%;
`;

const OrderItemBox = styled.div`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 10px 6px 10px 6px;
`;

const OrderHeader = styled(OrderItemBox)`
  background-color: #ebebeb;
`;

const TextBox = styled.div`
  margin-left: 10px;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

/**
 * 엑셀에서 읽어온 해당 주문서 아이템이 유효한 지를 확인합니다.
 * 옵션명, 파트너명, 송장번호, 주문자 번호, 통관부호, 배송요청사항, 
 * 배송사번호, 운송장 공유 일자를 제외하고 비어있는 값이 있으면 유효하지 않은 값으로 간주합니다.
 * @param item : SettlementItem
 * @returns
 *  유효할 경우 true, 아닐 경우 false
 */
export function isOrderItemValid(item: OrderItem) {
  if (
    item.seller == undefined ||
    item.seller == "" ||
    item.orderNumber == undefined ||
    item.orderNumber == "" ||
    item.productName == undefined ||
    item.productName == "" ||
    item.amount == undefined ||
    item.zipCode == undefined ||
    item.zipCode == "" ||
    item.address == undefined ||
    item.address == "" ||
    item.phone == undefined ||
    item.phone == "" ||
    item.orderer == undefined ||
    item.orderer == "" ||
    item.receiver == undefined ||
    item.receiver == "" ||
    item.managementNumber == undefined ||
    item.managementNumber == ""
  ) {
    return false;
  } else {
    return true;
  }
}

/**
 * 만약 판매처가 '카페24'일 경우 '로파공홈'으로 수정합니다.
 * @param item : SettlementItem (must be valid)
 * @returns
 *  유효할 경우 true, 아닐 경우 false
 */
export function setSellerIfLofa(item: OrderItem) {
  if (PossibleSellers.includes(item.seller)) {
    return true;
  } else if (item.seller === "카페24") {
    item.seller = "로파공홈";
    return true;
  } else {
    return false;
  }
}

/**
 * 상품명을 바탕으로 파트너명을 도출해 해당 주문서 아이템 정보에 넣습니다.
 * @param item : SettlementItem (must be valid)
 * @return
 *  파트너명을 유효하게 찾았을 경우 true,
 *  실패했을 경우 false
 */
export function setOrderPartnerName(item: OrderItem) {
  const regExp = /\[(.*?)\]/;
  let match = item.productName.match(regExp);
  if (match) {
    item.partnerName = match[1];
    return true;
  } else {
    return false;
  }
}

function OrderItem({
  item,
  index,
  check,
  onItemCheck,
  checkboxRequired = true,
  isWaybill = false,
  onItemShippingCompanySelect = (index: number, company: string) => {},
  onItemWaybillNumberEdit = (index: number, number: string) => {},
}: {
  item: OrderItem;
  index: number;
  check: boolean;
  onItemCheck: (index: number, isChecked: boolean) => void;
  checkboxRequired?: boolean;
  isWaybill?: boolean;
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

      <TextBox style={{ minWidth: "90px", width: "90px" }}>
        {item.managementNumber}
      </TextBox>
      <TextBox style={{ minWidth: "90px", width: "90px" }}>
        {item.seller}
      </TextBox>
      <TextBox style={{ minWidth: "160px", fontSize: "12px", width: "160px" }}>
        {item.orderNumber}
      </TextBox>
      {isWaybill ? (
        <>
          <ShippingCompanySelect
            shippingCompany={shippingCompany}
            setShippingCompany={(val: string) => {
              setShippingCompany(val);
              onItemShippingCompanySelect(index, val);
            }}
          />
          <input
            style={{ minWidth: "160px", width: "160px", marginLeft: "10px", fontSize: "12px", height: "40px"}}
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
      <TextBox style={{ minWidth: "450px", fontSize: "12px", width: "450px" }}>
        {item.productName}
      </TextBox>
      <TextBox style={{ minWidth: "250px", fontSize: "12px", width: "250px" }}>
        {item.optionName}
      </TextBox>
      <TextBox style={{ minWidth: "30px", width: "30px" }}>
        {item.amount}
      </TextBox>
      <TextBox style={{ minWidth: "60px", width: "60px" }}>
        {item.zipCode}
      </TextBox>
      <TextBox style={{ minWidth: "400px", fontSize: "12px", width: "400px" }}>
        {item.address}
      </TextBox>
      <TextBox style={{ minWidth: "150px", width: "150px" }}>
        {item.phone}
      </TextBox>
      <TextBox style={{ minWidth: "150px", width: "150px" }}>
        {item.ordererPhone}
      </TextBox>
      <TextBox style={{ minWidth: "90px", width: "90px" }}>
        {item.orderer}
      </TextBox>
      <TextBox style={{ minWidth: "90px", width: "90px" }}>
        {item.receiver}
      </TextBox>
      <TextBox style={{ minWidth: "90px", width: "90px" }}>
        {item.customsCode}
      </TextBox>
      <TextBox style={{ minWidth: "250px", fontSize: "12px", width: "250px" }}>
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
  isWaybill = false,
  onItemShippingCompanySelect,
  onItemWaybillNumberEdit,
}: {
  items: OrderItem[];
  itemsChecked: boolean[];
  onItemCheck: (index: number, isChecked: boolean) => void;
  onCheckAll: (isChecked: boolean) => void;
  defaultAllCheck: boolean;
  checkboxRequired?: boolean;
  isWaybill?: boolean;
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

          <TextBox style={{ minWidth: "90px" }}>관리번호</TextBox>
          <TextBox style={{ minWidth: "90px" }}>판매처</TextBox>
          <TextBox style={{ minWidth: "160px" }}>주문번호</TextBox>

          {isWaybill ? (
            <>
              <TextBox style={{ minWidth: "160px" }}>택배사</TextBox>
              <TextBox style={{ minWidth: "160px" }}>송장번호</TextBox>
            </>
          ) : (
            <></>
          )}

          <TextBox style={{ minWidth: "450px" }}>상품명</TextBox>
          <TextBox style={{ minWidth: "250px" }}>옵션명</TextBox>
          <TextBox style={{ minWidth: "30px" }}>수량</TextBox>
          <TextBox style={{ minWidth: "60px" }}>우편번호</TextBox>
          <TextBox style={{ minWidth: "400px" }}>주소</TextBox>
          <TextBox style={{ minWidth: "160px" }}>연락처</TextBox>
          <TextBox style={{ minWidth: "160px" }}>주문자 전화번호</TextBox>
          <TextBox style={{ minWidth: "90px" }}>주문자명</TextBox>
          <TextBox style={{ minWidth: "90px" }}>수취인</TextBox>
          <TextBox style={{ minWidth: "90px" }}>통관부호</TextBox>
          <TextBox style={{ minWidth: "250px" }}>배송요청사항</TextBox>
          <div style={{ width: "16px" }} />
        </OrderHeader>
        <OrderItemsBox>
          {items.map((item, index) => {
            return (
              <OrderItem
                key={`SettlementItem-${index}`}
                index={index}
                item={item}
                check={itemsChecked[index] ?? false}
                onItemCheck={onItemCheck}
                checkboxRequired={checkboxRequired}
                isWaybill={isWaybill}
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
