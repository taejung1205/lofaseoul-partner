import { Checkbox } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useSubmit } from "react-router-dom";
import styled from "styled-components";

export type SettlementItem = {
  seller: string;
  orderNumber: string;
  productName: string;
  optionName: string;
  price: number;
  amount: number;
  orderer: string;
  receiver: string;
  partnerName: string;
};

const SettlementBox = styled.div`
  width: inherit;
  height: 70%;
  min-height: 70%;
  position: relative;
`;

const SettlementItemsBox = styled.div`
  max-height: 90%;
  overflow-y: scroll;
`;

const SettlementItemBox = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 6px 10px 6px;
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
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

/**
 * 해당 정산아이템이 유효한 지를 확인합니다.
 * 파트너명, 옵션명을 제외하고 비어있는 값이 있으면 유효하지 않은 값으로 간주합니다.
 *
 * @param item : SettlementItem
 * @returns
 *  유효할 경우 true, 아닐 경우 false
 */
export function isSettlementItemValid(item: SettlementItem) {
  if (
    item.seller == undefined ||
    item.orderNumber == undefined ||
    item.productName == undefined ||
    item.price == undefined ||
    item.amount == undefined ||
    item.orderer == undefined ||
    item.receiver == undefined
  ) {
    return false;
  } else {
    return true;
  }
}

/**
 * 상품명을 바탕으로 파트너명을 도출해 해당 정산아이템 정보에 넣습니다. 
 * @param item : SettlementItem (must be valid)
 * @return
 *  파트너명을 유효하게 찾았을 경우 true,
 *  실패했을 경우 false
 */
export function setPartnerName(item: SettlementItem) {
  const regExp = /\[(.*?)\]/;
  let match = item.productName.match(regExp);
  if (match) {
    item.partnerName = match[1];
    return true;
  } else {
    return false;
  }
}

function SettlementItem({
  item,
  index,
  check,
  onCheck,
}: {
  item: SettlementItem;
  index: number;
  check: boolean;
  onCheck: (index: number, isChecked: boolean) => void;
}) {
  useEffect(() => {
    setIsChecked(check);
  }, [check]);
  const [isChecked, setIsChecked] = useState<boolean>(check);
  return (
    <SettlementItemBox key={`SettlementItem-${index}`}>
      <Checkbox
        color={"gray"}
        size={"sm"}
        checked={isChecked}
        onChange={(event) => {
          setIsChecked(event.currentTarget.checked);
          onCheck(index, event.currentTarget.checked);
        }}
      />
      <TextBox style={{ width: "90px" }}>{item.seller}</TextBox>
      <TextBox style={{ width: "150px", fontSize: "12px" }}>
        {item.orderNumber}
      </TextBox>
      <TextBox style={{ width: "calc(50% - 310px", fontSize: "12px" }}>
        {item.productName}
      </TextBox>
      <TextBox style={{ width: "calc(50% - 310px", fontSize: "12px" }}>
        {item.optionName}
      </TextBox>
      <TextBox style={{ width: "60px" }}>{item.price}</TextBox>
      <TextBox style={{ width: "30px" }}>{item.amount}</TextBox>
      <TextBox style={{ width: "90px" }}>{item.orderer}</TextBox>
      <TextBox style={{ width: "90px" }}>{item.receiver}</TextBox>
    </SettlementItemBox>
  );
}

export function SettlementTable({
  items,
  onSubmit,
}: {
  items: SettlementItem[];
  onSubmit: (settlementList: SettlementItem[]) => void;
}) {
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);

  function onCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  useEffect(() => {
    const newArr = Array(items.length).fill(false);
    setItemsChecked(newArr);
  }, [items]);

  useEffect(() => {}, [itemsChecked]);

  return (
    <SettlementBox>
      <SettlementHeader>
        <Checkbox
          color={"gray"}
          size={"sm"}
          onChange={(event) => {
            const val = event.currentTarget.checked;
            if (val) {
              const newArr = Array(items.length).fill(true);
              setItemsChecked(newArr);
            } else {
              const newArr = Array(items.length).fill(false);
              setItemsChecked(newArr);
            }
          }}
        />
        <TextBox style={{ width: "90px" }}>판매처</TextBox>
        <TextBox style={{ width: "150px" }}>주문번호</TextBox>
        <TextBox style={{ width: "calc(50% - 318px" }}>상품명</TextBox>
        <TextBox style={{ width: "calc(50% - 318px" }}>옵션명</TextBox>
        <TextBox style={{ width: "60px" }}>판매단가</TextBox>
        <TextBox style={{ width: "30px" }}>수량</TextBox>
        <TextBox style={{ width: "90px" }}>주문자</TextBox>
        <TextBox style={{ width: "90px" }}>송신자</TextBox>
        <div style={{ width: "16px" }} />
      </SettlementHeader>
      <SettlementItemsBox>
        {items.map((item, index) => {
          return (
            <SettlementItem
              key={`SettlementItem-${index}`}
              index={index}
              item={item}
              check={itemsChecked[index] ?? false}
              onCheck={onCheck}
            />
          );
        })}
      </SettlementItemsBox>
      <button
        onClick={() => {
          let settlementList = [];
          for (let i = 0; i < items.length; i++) {
            if (itemsChecked[i]) {
              settlementList.push(items[i]);
            }
          }
          onSubmit(settlementList);
        }}
      >
        gg
      </button>
    </SettlementBox>
  );
}
