import { useState } from "react";
import styled from "styled-components";
import * as xlsx from "xlsx";
import { SettlementTable } from "~/components/settlement";
import { SettlementItem } from "~/components/types";

const SettlementSharePage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

export default function AdminSettlementShare() {
  const [items, setItems] = useState<SettlementItem[]>([]);

  const readExcel = (e: any) => {
    console.log("start");
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: SettlementItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);
        const regExp = /\[(.*?)\]/;
        json.forEach((element: any) => {
          let item: SettlementItem = {
            seller: element.판매처,
            orderNumber: element.주문번호,
            productName: element.상품명,
            optionName: element.옵션명,
            price: element.판매단가,
            amount: element.수량,
            orderer: element.주문자,
            receiver: element.수령자,
            partnerName: "",
          };
          if (item.productName !== undefined) {
            let match = item.productName.match(regExp);
            if (match) {
              item.partnerName = match[1];
            }
          }
          array.push(item);
        });
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  return (
    <SettlementSharePage>
      <input type="file" onChange={readExcel} />
      {items !== undefined
        ? items.map((item: SettlementItem, index: number) => {
            console.log(item);
            return (
              <>
                <div>{item.productName}</div>
                <div>{item.partnerName}</div>
              </>
            );
          })
        : "tt"}
      <SettlementTable />
    </SettlementSharePage>
  );
}
