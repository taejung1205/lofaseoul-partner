import { Modal } from "@mantine/core";
import { ActionFunction } from "@remix-run/node";
import { Form, useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { render } from "react-dom";
import styled from "styled-components";
import * as xlsx from "xlsx";
import { dateToKorean, MonthSelectPopover } from "~/components/date";
import { BasicModal, ModalButton } from "~/components/modal";
import {
  isSettlementItemValid,
  setPartnerName,
  SettlementTable,
} from "~/components/settlement";
import { SettlementItem } from "~/components/settlement";

const SettlementSharePage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 30px 40px 30px 40px;
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
  if (data !== undefined) {
    const jsonArr: SettlementItem[] = JSON.parse(data);
    console.log(jsonArr);
  }
  return null;
};

export default function AdminSettlementShare() {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [fileName, setFileName] = useState<string>("");
  const [isErrorModalOpened, setIsErrorModalOpened] = useState<boolean>(false);
  const [errorStr, setErrorStr] = useState<string>("에러");
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKorean(selectedDate));
    }
  }, [selectedDate]);

  function submitSettlement(settlementList: SettlementItem[]) {
    const json = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("data", json);
    submit(formData, { method: "post" });
  }

  const readExcel = (e: any) => {
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

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
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

          let isValid = isSettlementItemValid(item);
          if (!isValid) {
            setErrorStr("유효하지 않은 엑셀 파일입니다.");
            setIsErrorModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }
          let nameResult = setPartnerName(item);
          if (!nameResult || item.partnerName.length == 0) {
            setErrorStr(
              "유효하지 않은 엑셀 파일입니다.\n상품명에 파트너 이름이 들어있는지 확인해주세요."
            );
            setIsErrorModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }
          array.push(item);
        }
        console.log(array);
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <>
      <BasicModal
        opened={isErrorModalOpened}
        onClose={() => setIsErrorModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {errorStr}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsErrorModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>
      <SettlementSharePage>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <MonthSelectPopover
            onLeftClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() - 1))
              )
            }
            onRightClick={() =>
              setSelectedDate(
                new Date(selectedDate!.setMonth(selectedDate!.getMonth() + 1))
              )
            }
            monthStr={selectedMonthStr ?? ""}
          />
        </div>
        <div style={{ height: "20px" }} />
        <div style={{ display: "flex" }} className="fileBox">
          <FileNameBox>{fileName}</FileNameBox>
          <div style={{ width: "20px" }} />
          <FileUploadButton htmlFor="uploadFile">파일 첨부</FileUploadButton>
          <FileUpload
            type="file"
            onChange={readExcel}
            id="uploadFile"
            accept=".xlsx,.xls"
          />
        </div>

        <div style={{ height: "20px" }} />
        <SettlementTable items={items} onSubmit={submitSettlement} />
      </SettlementSharePage>
    </>
  );
}
