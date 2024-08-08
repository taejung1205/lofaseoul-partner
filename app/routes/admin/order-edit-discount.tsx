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

type OrderDiscountEditItem = {

  discountStartDate: string; //할인 시작인
  discountEndDate: string; //할인 종료일
  partnerName: string; //공급처 (aka 파트너명)
  productName: string; //상품명
  partnerDiscountRate: number; //업체부담 할인율
  lofaDiscountRate: number; //로파부담할인율
  platformDiscountRate: number; //플랫폼부담할인율
  lofaAdjustmentFee: number; //로파 조정수수료율
  platformAdjustmentFee: number; //플랫폼 조정수수료율
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
