import { useEffect, useMemo, useState } from "react";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { PageLayout } from "~/components/page_layout";
import * as xlsx from "xlsx";
import { LoadingOverlay, Space } from "@mantine/core";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { CommonButton } from "~/components/button";
import {
  checkRevenueDataItem,
  RevenueDataItem,
} from "~/components/revenue_data";
import { BasicModal, ModalButton } from "~/components/modal";
import { PartnerProfile } from "~/components/partner_profile";
import { json, LoaderFunction } from "@remix-run/node";
import { getAllPartnerProfiles } from "~/services/firebase.server";
import { adjustSellerName } from "~/components/seller";

export const loader: LoaderFunction = async ({ request }) => {
  const partnersMap = await getAllPartnerProfiles();
  const partnersArr = Array.from(partnersMap.values());
  return json({ partners: partnersArr });
};

export default function Page() {
  const [fileName, setFileName] = useState<string>("");
  const [items, setItems] = useState<RevenueDataItem[]>([]);
  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const navigation = useNavigation();
  const loaderData = useLoaderData();

  const partnerProfiles = useMemo(() => {
    let map = new Map();
    loaderData.partners.forEach((partner: PartnerProfile) => {
      map.set(partner.name, partner);
    });
    return map;
  }, [loaderData]);

  useEffect(() => {}, [items]);

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: RevenueDataItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);
        console.log("json length", json.length);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: RevenueDataItem = {
            orderDate: element.주문일,
            seller: element.판매처?.toString(),
            partnerName: element.공급처?.toString(),
            productName: element.상품명?.toString(),
            option: element.옵션명?.toString() ?? "",
            price: Number(element.판매가),
            amount: Number(element.주문수량),
            orderStatus: element.상태?.toString(),
            cs: element["CS"]?.toString(),
            isDiscounted: false,
          };

          const result = checkRevenueDataItem(item);
          if (!result.isValid) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다. ${i + 2}행에 ${result.message} `
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            e.target.value = "";
            return false;
          }

          const partnerProfile = partnerProfiles.get(item.partnerName);

          // if (partnerProfile === undefined) {
          //   console.log(item);
          //   setNoticeModalStr(
          //     `유효하지 않은 엑셀 파일입니다.\n해당 공급처가 계약업체목록에 있는지 확인해주세요. (${item.partnerName})`
          //   );
          //   setIsNoticeModalOpened(true);
          //   setFileName("");
          //   setItems([]);
          //   return false;
          // }

          const isSellerNameValid = adjustSellerName(item);

          if (!isSellerNameValid) {
            console.log(item);
            setNoticeModalStr(
              `${i + 2}행의 판매처가 유효하지 않습니다. (${item.seller}) `
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            e.target.value = "";
            return false;
          }

          array.push(item);
        }
        console.log(array.length);
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
      e.target.value = "";
    }
  };

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      <BasicModal
        opened={isNoticeModalOpened}
        onClose={() => setIsNoticeModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {noticeModalStr}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsNoticeModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>
      <PageLayout>
        <div style={{ display: "flex" }} className="fileBox">
          <FileNameBox>{fileName}</FileNameBox>
          <Space w={20} />
          <FileUploadButton htmlFor="uploadFile">파일 첨부</FileUploadButton>
          <FileUpload
            type="file"
            onChange={readExcel}
            id="uploadFile"
            accept=".xlsx,.xls"
          />
          <Space w={20} />
          <CommonButton width={200}>할인 적용 미리보기</CommonButton>
        </div>
      </PageLayout>
    </>
  );
}
