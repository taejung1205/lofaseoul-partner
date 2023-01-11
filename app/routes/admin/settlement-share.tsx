import { useState } from "react";
import styled from "styled-components";
import * as xlsx from "xlsx";

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
  const [items, setItems] = useState<any>();

  const readExcel = (e: any) => {
    console.log("start");
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);
        setItems(json);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  return (
    <SettlementSharePage>
      <input type="file" onChange={readExcel} />
      {items !== undefined
        ? items.map((item: any, index: number) => {
            console.log(item);
            return <div>{item.업체명}</div>;
          })
        : "tt"}
      <button onClick={() => console.log(items.length)}>xx</button>
    </SettlementSharePage>
  );
}
