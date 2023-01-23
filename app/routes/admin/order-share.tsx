import { useEffect, useMemo, useState } from "react";
import {
  dateToDayStr, dayStrToDate
} from "~/components/date";

import dayPickerStyles from "react-day-picker/dist/style.css";
import styled from "styled-components";
import { json, LoaderFunction } from "@remix-run/node";
import { PageLayout } from "~/components/page_layout";
import { OrderItem } from "~/components/order";
import * as xlsx from "xlsx";
import { useLoaderData } from "@remix-run/react";

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

const ShareButton = styled.button`
  background-color: black;
  color: white;
  font-size: 24px;
  font-weight: 700;
  width: 350px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
`;

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const day = url.searchParams.get("day");

  if (day !== null) {
    //   const monthStr = numeralMonthToKorean(month);
    //   const sums = await getAllSettlementSum({
    //     monthStr: monthStr,
    //   });
    //   console.log(sums);
    return json({ day: day });
  } else {
    return null;
  }
};

export default function AdminOrderShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [fileName, setFileName] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);

  const [isErrorModalOpened, setIsErrorModalOpened] = useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);

  const loaderData = useLoaderData();

  const readExcel = (e: any) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: OrderItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: OrderItem = {
            seller: element.판매처,
            orderNumber: element.주문번호,
            productName: element.상품명,
            optionName: element.옵션명 ?? "",
            amount: element.배송수량,
            orderer: element.주문자명,
            receiver: element.수취인,
            partnerName: "",
            zipCode: element.우편번호,
            address: element.주소,
            phone: element.연락처,
            ordererPhone: element["주문자 전화번호"] ?? "",
            customsCode: element.통관부호 ?? "",
            deliveryRequest: element.배송요청사항 ?? "",
            managementNumber: element.관리번호,
            shippingCompanyNumber: element.배송사코드,
            waybillNumber: element.송장번호
          };

          // let isValid = isSettlementItemValid(item);
          // if (!isValid) {
          //   setErrorStr("유효하지 않은 엑셀 파일입니다.");
          //   setIsErrorModalOpened(true);
          //   setFileName("");
          //   setItems([]);
          //   return false;
          // }

          // setSellerIfLofa(item);

          // let nameResult = setSettlementPartnerName(item);
          // if (!nameResult || item.partnerName.length == 0) {
          //   setErrorStr(
          //     "유효하지 않은 엑셀 파일입니다.\n상품명에 파트너 이름이 들어있는지 확인해주세요."
          //   );
          //   setIsErrorModalOpened(true);
          //   setFileName("");
          //   setItems([]);
          //   return false;
          // }

          // const partnerProfile = partnerProfiles.get(item.partnerName);
          // if (partnerProfile === undefined) {
          //   setErrorStr(
          //     `유효하지 않은 엑셀 파일입니다.\n상품명의 파트너가 계약 업체 목록에 있는지 확인해주세요. (${item.partnerName})`
          //   );
          //   setIsErrorModalOpened(true);
          //   setFileName("");
          //   setItems([]);
          //   return false;
          // }

          //setSettlementFee(item, partnerProfile);

          array.push(item);
        }
        console.log(array);
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  //날짜 수신
  useEffect(() => {
    if (loaderData == null) {
      setSelectedDate(new Date());
    } else {
      setSelectedDate(dayStrToDate(loaderData.day));
    }
  }, []);

  return (
    <>
      <PageLayout>
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
      </PageLayout>
    </>
  );
}
