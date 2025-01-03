import { useEffect, useMemo, useRef, useState } from "react";
import { dateToDayStr } from "~/utils/date";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { PageLayout } from "~/components/page_layout";
import {
  isOrderItemValid,
  OrderItem,
  OrderTableMemo,
} from "~/components/order";
import * as xlsx from "xlsx";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { getAllPartnerProfiles } from "~/services/firebase/firebase.server";
import { PartnerProfile } from "~/components/partner_profile";
import { BasicModal, ModalButton } from "~/components/modal";
import { LoadingOverlay } from "@mantine/core";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { adjustSellerName } from "~/components/seller";
import {
  addOrders,
  isTodayOrderShared,
} from "~/services/firebase/order.server";

function ShareButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "350px",
    lineHeight: 1,
    padding: "6px",
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "share") {
    const order = body.get("order")?.toString();
    const day = body.get("day")?.toString();
    if (order !== undefined && day !== undefined) {
      const jsonArr: OrderItem[] = JSON.parse(order);
      const result = await addOrders({ orders: jsonArr, dayStr: day });
      if (result == true) {
        return json({ message: `${day} 주문 공유가 완료되었습니다.` });
      } else {
        return json({
          message: `주문 공유 중 오류가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const isTodayShared = await isTodayOrderShared();
  const partnersMap = await getAllPartnerProfiles();
  const partnersArr = Array.from(partnersMap.values());
  return json({ isTodayShared: isTodayShared, partners: partnersArr });
};

export default function AdminOrderShare() {
  const [fileName, setFileName] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [currentDay, setCurrentDay] = useState<string>(""); //현재 시점 날짜

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);

  const loaderData = useLoaderData();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const partnerProfiles = useMemo(() => {
    let map = new Map();
    loaderData.partners.forEach((partner: PartnerProfile) => {
      map.set(partner.providerName, partner);
    });
    return map;
  }, [loaderData]);

  useEffect(() => {
    const today = dateToDayStr(new Date());
    setCurrentDay(today);
  }, []);

  useEffect(() => {
    const newArr = Array(items.length).fill(true);
    setItemsChecked(newArr);
  }, [items]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  function shareOrder(orderList: OrderItem[], dayStr: string) {
    const json = JSON.stringify(orderList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("order", json);
    formData.set("day", dayStr);
    formData.set("action", "share");
    submit(formData, { method: "post" });
  }

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        console.log(partnerProfiles);
        const array: OrderItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: OrderItem = {
            seller: element.판매처?.toString(),
            orderNumber: element.주문번호?.toString(),
            productName: element.상품명?.toString(),
            optionName: element.옵션명?.toString() ?? "",
            amount: Number(element.배송수량),
            providerName: element.공급처?.toString(),
            receiver: element.수취인?.toString(),
            zipCode: element.우편번호?.toString(),
            address: element.주소?.toString(),
            phone: element.연락처?.toString(),
            customsCode: element.통관부호?.toString() ?? "",
            deliveryRequest: element.배송요청사항?.toString() ?? "",
            managementNumber: element.관리번호?.toString(),
            shippingCompany: "",
            waybillNumber: "",
            waybillSharedDate: "",
            orderSharedDate: "",
          };

          let checkValidResult = isOrderItemValid(item);

          if (checkValidResult !== "ok") {
            if (i == 0) {
              setNoticeModalStr(
                `유효하지 않은 엑셀 파일입니다.\n첫 번째 줄의 ${checkValidResult}\n항목 이름이 정상적인지 확인해주세요.`
              );
            } else {
              setNoticeModalStr(
                `유효하지 않은 엑셀 파일입니다.\n${
                  i + 2
                }번째 줄의 ${checkValidResult}\n해당 아이템을 확인해주세요.`
              );
            }
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            e.target.value = "";
            return false;
          }

          adjustSellerName(item);

          const partnerProfile = partnerProfiles.get(item.providerName);

          if (partnerProfile === undefined) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다.\n상품명의 파트너가 계약 업체 목록에 있는지 확인해주세요. (${item.providerName})`
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

      <BasicModal
        opened={isShareModalOpened}
        onClose={() => setIsShareModalOpened}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {loaderData.isTodayShared == null
            ? `${dateToDayStr(new Date())} 주문을 전달하시겠습니까?`
            : `금일(${loaderData.isTodayShared}) 공유된 주문건이 있습니다. 추가로 공유하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsShareModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                let orderList = [];
                for (let i = 0; i < items.length; i++) {
                  if (itemsChecked[i]) {
                    orderList.push(items[i]);
                  }
                }
                if (orderList.length > 0 && currentDay.length > 0) {
                  shareOrder(orderList, currentDay);
                } else {
                  setNoticeModalStr("선택된 주문건이 없습니다.");
                  setIsNoticeModalOpened(true);
                }

                setIsShareModalOpened(false);
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
        <div style={{ height: "20px" }} />
        <OrderTableMemo
          items={items}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={true}
        />
        <div style={{ height: "20px" }} />
        {items.length > 0 ? (
          <div
            style={{
              width: "inherit",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <ShareButton
              onClick={() => {
                const today = dateToDayStr(new Date());
                if (today !== currentDay) {
                  setNoticeModalStr(
                    "날짜가 변경되었습니다. 페이지를 새로고침해주세요."
                  );
                } else {
                  setIsShareModalOpened(true);
                }
              }}
            >
              주문서 전송
            </ShareButton>
          </div>
        ) : (
          <></>
        )}
        <div>
          {`* `}
          <span style={{ color: "red" }}>*</span>
          {`로 표시된 항목은 엑셀 내 모든 항목에 필수적으로 기입되야 합니다.`}
        </div>
      </PageLayout>
    </>
  );
}
