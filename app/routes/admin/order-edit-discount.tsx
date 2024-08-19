import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { PageLayout } from "~/components/page_layout";
import * as xlsx from "xlsx";
import { LoadingOverlay, Space } from "@mantine/core";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  checkDiscountData,
  DiscountData,
  DiscountDataTableMemo,
} from "~/components/discount";
import {
  addDiscountData,
  getAllPartnerProfiles,
} from "~/services/firebase.server";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { PartnerProfile } from "~/components/partner_profile";
import { BlackButton } from "~/components/button";

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
};

export const loader: LoaderFunction = async ({ request }) => {
  const partnersMap = await getAllPartnerProfiles();
  const partnersArr = Array.from(partnersMap.values());
  return json({ partners: partnersArr });
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "upload") {
    const data = body.get("data")?.toString();
    if (data !== undefined) {
      const result = await addDiscountData({
        data: data,
      });
      if (result === true) {
        return json({
          status: "ok",
          message: `할인내역 자료가 등록되었습니다. 잠시 후 DB에 반영될 예정입니다.`,
        });
      } else {
        console.log("error", result);
      }
    }
  }
  return null;
};

export default function Page() {
  const [fileName, setFileName] = useState<string>("");
  const [items, setItems] = useState<DiscountData[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isUploadModalOpened, setIsUploadModalOpened] =
    useState<boolean>(false);

  const navigation = useNavigation();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  const partnerProfiles = useMemo(() => {
    let map = new Map();
    loaderData.partners.forEach((partner: PartnerProfile) => {
      map.set(partner.name, partner);
    });
    return map;
  }, [loaderData]);

  useEffect(() => {
    const newArr = Array(items.length).fill(true);
    setItemsChecked(newArr);
  }, [items]);

  useEffect(() => {
    setIsLoading(false);
  }, [itemsChecked]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
      setIsLoading(false);
    }
  }, [actionData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  async function submitAddDiscountData(dataList: DiscountData[]) {
    console.log("submit add discount data, length:", dataList.length);
    const data = JSON.stringify(dataList);
    console.log(data, "data");
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("data", data);
    formData.set("action", "upload");
    submit(formData, { method: "post" });
  }

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let json: any;
    setIsLoading(true);
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: DiscountData[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);
        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: DiscountData = {
            startDate: element.할인시작일,
            endDate: element.할인종료일,
            partnerName: element.공급처?.toString(),
            productName: element.상품명?.toString(),
            partnerDiscountLevy: Number(element.업체부담할인율) ?? 0,
            lofaDiscountLevy: Number(element.로파부담할인율) ?? 0,
            platformDiscountLevy: Number(element.플랫폼부담할인율) ?? 0,
            lofaAdjustmentFee: Number(element.로파조정수수료율) ?? 0,
            platformAdjustmentFee: Number(element.플랫폼조정수수료율) ?? 0,
          };
          const result = checkDiscountData(item);
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

          if (partnerProfile === undefined) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다. ${
                i + 2
              }행의 공급처가 계약업체목록에 있는지 확인해주세요. (${
                item.partnerName
              })`
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          array.push(item);
        }
        console.log("할인내역 개수: ", array.length);
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

      {/* 안내메세지모달 */}
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

      {/*업로드 모달*/}
      <BasicModal
        opened={isUploadModalOpened}
        onClose={() => setIsUploadModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          선택한 항목들을 할인내역에 반영하시겠습니까?
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsUploadModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                setIsLoading(true);
                setIsUploadModalOpened(false);
                let discountDataList = [];
                for (let i = 0; i < items.length; i++) {
                  if (itemsChecked[i]) {
                    discountDataList.push(items[i]);
                  }
                }
                setIsLoading(false);
                if (discountDataList.length > 0) {
                  submitAddDiscountData(discountDataList);
                } else {
                  setNoticeModalStr("선택된 항목이 없습니다.");
                  setIsNoticeModalOpened(true);
                }
              }}
            >
              공유
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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
        <Space h={20} />
        <DiscountDataTableMemo
          items={items}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={true}
        />
        <Space h={20} />
        <BlackButton onClick={() => setIsUploadModalOpened(true)}>
          업로드
        </BlackButton>
      </PageLayout>
    </>
  );
}
