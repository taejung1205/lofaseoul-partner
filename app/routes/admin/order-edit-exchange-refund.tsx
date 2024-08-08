import { useState } from "react";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { PageLayout } from "~/components/page_layout";
import * as xlsx from "xlsx";
import { LoadingOverlay } from "@mantine/core";
import { useNavigation } from "@remix-run/react";

type OrderEditItem = {
  orderStatus: string; //주문상태
  orderNumber: string; //주문번호
  partnerName: string; //공급처 (aka 파트너명)
  productName: string; //상품명
  seller: string; //판매처
  managementNumber: string; //관리번호
  cancelDate: string; //취소일
  orderer: string; //주문자
  shippingFee: string;
} 

export default function Page() {
  const [fileName, setFileName] = useState<string>("");
  const navigation = useNavigation();

  const readExcel = (e: any) => {
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
        for (let i = 0; i < json.length; i++) {
          let element = json[i];
        }
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
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
      </PageLayout>
    </>
  );
}
