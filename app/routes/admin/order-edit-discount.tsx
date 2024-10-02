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
import { getAllPartnerProfiles } from "~/services/firebase/firebase.server";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { PartnerProfile } from "~/components/partner_profile";
import { BlackButton } from "~/components/button";
import { requireUser } from "~/services/session.server";
import { addDiscountData } from "~/services/firebase/discount.server";
import { adjustSellerName } from "~/components/seller";

export const loader: LoaderFunction = async ({ request }) => {
  //스태프는 접근 불가
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/logout");
  }

  if (user.isStaff) {
    return redirect("/admin/dashboard");
  }

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
        return json({
          status: "error",
          message: result,
        });
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
      map.set(partner.providerName, partner);
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
            seller: element.판매처?.toString(),
            providerName: element.공급처?.toString(),
            productName: element.상품명?.toString(),
            partnerDiscountLevyRate: Number(element.업체부담할인율) ?? 0,
            lofaDiscountLevyRate: Number(element.로파부담할인율) ?? 0,
            platformDiscountLevyRate: Number(element.플랫폼부담할인율) ?? 0,
            lofaAdjustmentFeeRate: Number(element.로파조정수수료율) ?? 0,
            platformAdjustmentFeeRate: Number(element.플랫폼조정수수료율) ?? 0,
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

          //xlsx Date 인식 시간 오차 해결을 위한 보정
          item.startDate = new Date(item.startDate!.getTime() + 5 * 60000);
          item.endDate = new Date(item.endDate!.getTime() + 5 * 60000);

          const partnerProfile = partnerProfiles.get(item.providerName);

          if (partnerProfile === undefined) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다. ${
                i + 2
              }행의 공급처가 계약업체목록에 있는지 확인해주세요. (${
                item.providerName
              })`
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

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
                if (discountDataList.length == 0) {
                  setNoticeModalStr("선택된 항목이 없습니다.");
                  setIsNoticeModalOpened(true);
                } else if (discountDataList.length > 20) {
                  setNoticeModalStr(
                    "한 번에 최대 20개의 할인내역만 업로드가 가능합니다."
                  );
                  setIsNoticeModalOpened(true);
                } else {
                  submitAddDiscountData(discountDataList);
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
