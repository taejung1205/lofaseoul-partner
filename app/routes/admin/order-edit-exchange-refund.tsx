import { useEffect, useRef, useState } from "react";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { PageLayout } from "~/components/page_layout";
import * as xlsx from "xlsx";
import { LoadingOverlay, Space } from "@mantine/core";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { requireUser } from "~/services/session.server";
import {
  checkExchangeRefundData,
  ExchangeRefundData,
  ExchangeRefundTableMemo,
} from "~/components/exchange_refund";
import { BasicModal, ModalButton } from "~/components/modal";
import { BlackButton } from "~/components/button";
import { applyExchangeRefundData } from "~/services/firebase/exchangeRefund.server";

export const loader: LoaderFunction = async ({ request }) => {
  //스태프는 접근 불가
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/logout");
  }

  if (user.isStaff) {
    return redirect("/admin/dashboard");
  }

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "upload") {
    const data = body.get("data")?.toString();
    if (data !== undefined) {
      const result = await applyExchangeRefundData({
        data: data,
      });
      if (result.status === "ok") {
        return json({
          status: "ok",
          message: `${result.count}건의 자료가 수정되었습니다.`,
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
  const [items, setItems] = useState<ExchangeRefundData[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isUploadModalOpened, setIsUploadModalOpened] =
    useState<boolean>(false);

  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

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

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: ExchangeRefundData[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: ExchangeRefundData = {
            orderNumber: element.주문번호?.toString(),
            productName: element.상품명?.toString(),
            orderStatus: element.상태?.toString(),
            cs: element["CS"]?.toString(),
          };

          const result = checkExchangeRefundData(item);
          if (!result.isValid) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다.\n${i + 2}행에 ${result.message} `
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

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  async function submitApplyExchangeRefundData(dataList: ExchangeRefundData[]) {
    console.log("submit data, length:", dataList.length);
    const data = JSON.stringify(dataList);
    console.log(data, "data");
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("data", data);
    formData.set("action", "upload");
    submit(formData, { method: "post" });
  }

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
                  submitApplyExchangeRefundData(revenuedataList);
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
        <ExchangeRefundTableMemo
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
