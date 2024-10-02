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
import { BlackButton, CommonButton } from "~/components/button";
import {
  checkRevenueDataItem,
  getRevenueDataPeriod,
  RevenueData,
  RevenueDataTableMemo,
} from "~/components/revenue_data";
import { BasicModal, ModalButton } from "~/components/modal";
import { PartnerProfile } from "~/components/partner_profile";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { getAllPartnerProfiles } from "~/services/firebase/firebase.server";
import { adjustSellerName } from "~/components/seller";
import { dateToDayStr } from "~/utils/date";
import { requireUser } from "~/services/session.server";
import { addRevenueData } from "~/services/firebase/revenueData.server";
import { getDiscountData } from "~/services/firebase/discount.server";

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
      const result = await addRevenueData({
        data: data,
      });
      if (result === true) {
        return json({
          status: "ok",
          message: `수익통계 자료가 등록되었습니다. 잠시 후 DB에 반영될 예정입니다.`,
        });
      } else {
        console.log("error", result);
      }
    }
  } else if (actionType == "discount-preview") {
    const startDateStr = body.get("startDate")?.toString();
    const endDateStr = body.get("startDate")?.toString();
    if (startDateStr == null || endDateStr == null) {
      return json({
        status: "error",
        message: `검색 조건에 오류가 발생하였습니다.`,
      });
    }
    const startDate = new Date(`${startDateStr}T00:00:00.000+09:00`);
    const endDate = new Date(`${endDateStr}T23:59:59.000+09:00`);
    const searchResult = await getDiscountData({
      startDate: startDate,
      endDate: endDate,
      seller: "",
      providerName: "",
      productName: "",
    });
    return json({
      status: "ok",
      discountData: searchResult,
    });
  }
  return null;
};

export default function Page() {
  const [fileName, setFileName] = useState<string>("");
  const [items, setItems] = useState<RevenueData[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDiscountPreview, setIsDiscountPreview] = useState<boolean>(false);

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

  const discountData = useMemo(() => {
    if (actionData) {
      return actionData.discountData;
    } else {
      return undefined;
    }
  }, [actionData]);

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

  useEffect(() => {
    if (discountData) {
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const revenueData = items[i];
        for (let j = 0; j < discountData.length; j++) {
          const data = discountData[j].data;
          if (
            revenueData.productName == data.productName &&
            revenueData.orderDate >= new Date(data.startDate) &&
            revenueData.orderDate <= new Date(data.endDate)
          ) {
            revenueData.isDiscounted = true;
            revenueData.lofaDiscountLevyRate = data.lofaDiscountLevyRate;
            revenueData.partnerDiscountLevyRate = data.partnerDiscountLevyRate;
            revenueData.platformDiscountLevyRate =
              data.platformDiscountLevyRate;
            revenueData.lofaAdjustmentFeeRate = data.lofaAdjustmentFeeRate;
            revenueData.platformAdjustmentFeeRate =
              data.platformAdjustmentFeeRate;
            count++;
          }
        }
      }

      setNoticeModalStr(`${count}건에 대해 할인이 미리 적용되었습니다.`);
      setIsNoticeModalOpened(true);
      setIsLoading(false);
      setIsDiscountPreview(true);
    }
  }, [discountData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  function onDiscountPreviewClicked() {
    setIsLoading(true);
    const period = getRevenueDataPeriod(items);
    if (period.startDate && period.endDate) {
      submitDiscountPreview(period.startDate, period.endDate);
    } else {
      setNoticeModalStr("통계 파일을 올린 후 사용 가능합니다.");
      setIsNoticeModalOpened(true);
      setIsLoading(false);
    }
  }

  async function submitAddRevenueData(dataList: RevenueData[]) {
    setIsDiscountPreview(false);
    console.log("submit add revenue data, length:", dataList.length);
    const data = JSON.stringify(dataList);
    console.log(data, "data");
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("data", data);
    formData.set("action", "upload");
    submit(formData, { method: "post" });
  }

  async function submitDiscountPreview(startDate: Date, endDate: Date) {
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("action", "discount-preview");
    formData.set("startDate", dateToDayStr(startDate));
    formData.set("endDate", dateToDayStr(endDate));
    submit(formData, { method: "post" });
  }

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsDiscountPreview(false);
    let json: any;
    setIsLoading(true);
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: RevenueData[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: RevenueData = {
            orderDate: element.주문일,
            seller: element.판매처?.toString(),
            providerName: element.공급처?.toString(),
            orderNumber: element.주문번호?.toString(),
            productName: element.상품명?.toString(),
            optionName: element.옵션명?.toString() ?? "",
            price: Number(element.판매가),
            amount: Number(element.주문수량),
            orderStatus: element.상태?.toString(),
            cs: element["CS"]?.toString(),
            isDiscounted: false,
            category: element.카테고리?.toString(),
            cost: Number(element.원가),
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

          //xlsx Date 인식 시간 오차 해결을 위한 보정
          item.orderDate = new Date(item.orderDate!.getTime() + 5 * 60000);

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
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
      e.target.value = "";
    }
  };

  return (
    <>
      <LoadingOverlay
        visible={navigation.state == "loading" || isLoading}
        overlayBlur={2}
      />

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
          선택한 항목들을 수익통계에 반영하시겠습니까?
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsUploadModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                setIsLoading(true);
                setIsUploadModalOpened(false);
                let revenuedataList = [];
                for (let i = 0; i < items.length; i++) {
                  if (itemsChecked[i]) {
                    revenuedataList.push(items[i]);
                  }
                }
                setIsLoading(false);
                if (revenuedataList.length > 0) {
                  submitAddRevenueData(revenuedataList);
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
          <Space w={20} />
          <FileUploadButton htmlFor="uploadFile">파일 첨부</FileUploadButton>
          <FileUpload
            type="file"
            onChange={readExcel}
            id="uploadFile"
            accept=".xlsx,.xls"
          />
          <Space w={20} />
          <CommonButton
            width={200}
            onClick={() => {
              onDiscountPreviewClicked();
            }}
          >
            할인 적용 미리보기
          </CommonButton>
        </div>
        <Space h={20} />
        <RevenueDataTableMemo
          items={items}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={true}
          isDiscountPreview={isDiscountPreview}
        />
        <Space h={20} />
        <BlackButton onClick={() => setIsUploadModalOpened(true)}>
          업로드
        </BlackButton>
        <div>
          {`* `}
          <span style={{ color: "red" }}>*</span>
          {`로 표시된 항목은 엑셀 내 모든 항목에 필수적으로 기입되야 합니다.`}
        </div>
      </PageLayout>
    </>
  );
}
