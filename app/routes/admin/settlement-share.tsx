import { ActionFunction } from "@remix-run/node";
import { Form, useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { render } from "react-dom";
import styled from "styled-components";
import * as xlsx from "xlsx";
import { SettlementTable } from "~/components/settlement";
import { SettlementItem } from "~/components/settlement";

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

const FileNameBox = styled.div`
  border: 3px solid #000000;
  background-color: #efefef;
  width: 550px;
  max-width: 70%;
  font-size: 20px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 6px;
  text-align: left;
`;

const FileUploadButton = styled.label`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  line-height: 24px;
  padding: 6px;
  cursor: pointer;
`;

const FileUpload = styled.input`
  width: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const data = body.get("data")?.toString();
  console.log(data);
  return null;
};

export default function AdminSettlementShare() {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  function submitSettlement(settlementList: SettlementItem[]) {
    const json = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("data", json);
    submit(formData, { method: "post" });
  }

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
        console.log(array);
        setItems(array);
        let newArr: boolean[] = new Array(array.length).fill(false);
        setItemsChecked(newArr);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  useEffect(() => {
    // console.log(itemsChecked);
  }, [itemsChecked]);

  return (
    <SettlementSharePage>
      <div style={{ display: "flex" }} className="fileBox">
        <FileNameBox>{fileName}</FileNameBox>
        <div style={{ width: "20px" }} />
        <FileUploadButton htmlFor="uploadFile">파일 첨부</FileUploadButton>
        <FileUpload type="file" onChange={readExcel} id="uploadFile" />
      </div>

      <div style={{ height: "20px" }} />
      <SettlementTable
        items={items}
        onSubmit={submitSettlement}
        // itemsChecked={itemsChecked}
        // setItemsChecked={setItemsChecked}
      />
    </SettlementSharePage>
  );
}
