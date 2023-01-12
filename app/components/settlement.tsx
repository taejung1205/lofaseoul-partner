import { Checkbox } from "@mantine/core";
import styled from "styled-components";

const SettlementBox = styled.div`
  border: 1px solid black;
  width: inherit;
  overflow: scroll;
`;

const SettlementHeader = styled.div`
  background-color: #ebebeb;
  display: flex;
  align-items: center;
  padding: 10px;
`;

const TextBox = styled.div`
  margin-left: 10px;
  font-weight: 700;
  font-size: 16px;
  text-align: center;
`;

const SellerTextBox = styled(TextBox)`
    width: 95px;
`

export function SettlementTable() {
  return (
    <SettlementBox>
      <SettlementHeader>
        <Checkbox color={"gray"} size={"sm"} />
        <SellerTextBox>판매처</SellerTextBox>
        <div>주문번호</div>
        <div>상품명</div>
        <div>옵션명</div>
        <div>판매단가</div>
        <div>수량</div>
        <div>주문자</div>
        <div>송신자</div>
      </SettlementHeader>
    </SettlementBox>
  );
}
