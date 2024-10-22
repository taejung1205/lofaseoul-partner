import { LoadingOverlay, Space } from "@mantine/core";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as xlsx from "xlsx";
import { MonthSelectPopover } from "~/components/date";
import {
  FileNameBox,
  FileUpload,
  FileUploadButton,
} from "~/components/file_upload";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import { adjustSellerName } from "~/components/seller";
import {
  isSettlementItemValid,
  setSettlementFee,
  SettlementTableMemo,
} from "~/components/settlement_table";
import { SettlementItem } from "~/components/settlement_table";
import { getAllPartnerProfiles } from "~/services/firebase/firebase.server";
import {
  addSettlements,
  getSettlementMonthes,
} from "~/services/firebase/settlement.server";
import { requireUser } from "~/services/session.server";
import { dateToKoreanMonth, getTimezoneDate } from "~/utils/date";

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

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "share") {
    const settlement = body.get("settlement")?.toString();
    const month = body.get("month")?.toString();
    if (settlement !== undefined && month !== undefined) {
      const result = await addSettlements({
        settlements: settlement,
        monthStr: month,
      });
      if (result === true) {
        return json({
          message: `${month} 정산내역 공유가 등록되었습니다. 잠시 후 기록이 반영될 예정입니다.`,
        });
      } else {
        throw Error();
      }
    }
  }
  return null;
};

export let loader: LoaderFunction = async ({ request }) => {
  //스태프는 접근 불가
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/logout");
  }

  if (user.isStaff) {
    return redirect("/admin/dashboard");
  }

  const monthes = await getSettlementMonthes();
  const partnersMap = await getAllPartnerProfiles();
  const partnersArr = Array.from(partnersMap.values());
  return json({ monthes: monthes, partners: partnersArr });
};

export default function AdminSettlementShare() {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [fileName, setFileName] = useState<string>("");

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);
  const [noticeModalStr, setNoticeModalStr] = useState<string>("에러");

  const navigation = useNavigation();
  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const sharedMonthes: string[] = loaderData.monthes;
  const partnerProfiles = useMemo(() => {
    let map = new Map();
    loaderData.partners.forEach((partner: PartnerProfile) => {
      map.set(partner.providerName, partner);
    });
    return map;
  }, [loaderData]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setSelectedDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    const newArr = Array(items.length).fill(true);
    setItemsChecked(newArr);
  }, [items]);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message ?? actionData);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  async function submitAddSettlements(settlementList: SettlementItem[]) {
    console.log("submit add settlement, length:", settlementList.length);
    const data = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", data);
    formData.set("month", selectedMonthStr!);
    formData.set("action", "share");
    submit(formData, { method: "post" });
  }

  const readExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: SettlementItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: SettlementItem = {
            orderDate: element.주문일,
            partnerName: "",
            providerName: element.공급처?.toString(),
            seller: element.판매처?.toString(),
            orderNumber: element.주문번호?.toString(),
            productName: element.상품명?.toString(),
            optionName: element.옵션명?.toString() ?? "",
            price: element.판매단가,
            amount: element.수량,
            orderer: element.주문자?.toString(),
            receiver: element.수령자?.toString(),
            fee: -1,
            shippingFee: -1,
            orderTag: element.주문태그?.toString() ?? "",
            isDiscounted: false,
          };

          let checkValidResult = isSettlementItemValid(item);

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

          //xlsx Date 인식 시간 오차 해결을 위한 보정
          item.orderDate = new Date(item.orderDate!.getTime() + 5 * 60000);

          adjustSellerName(item);

          // let nameResult = setSettlementPartnerName(item);
          // if (!nameResult || item.partnerName.length == 0) {
          //   setNoticeModalStr(
          //     "유효하지 않은 엑셀 파일입니다.\n상품명에 파트너 이름이 들어있는지 확인해주세요."
          //   );
          //   setIsNoticeModalOpened(true);
          //   setFileName("");
          //   setItems([]);
          //   e.target.value = '';
          //   return false;
          // }

          const partnerProfile = partnerProfiles.get(item.providerName);
          if (partnerProfile === undefined) {
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다.\n${i + 2}번째줄의 '${
                item.providerName
              }'가 계약업체목록에 있는지 확인해주세요. (공급처명 기준) `
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            e.target.value = "";
            return false;
          }

          item.partnerName = partnerProfile.name;

          setSettlementFee(item, partnerProfile);

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
            whiteSpace: "pre-line",
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
          {sharedMonthes.includes(selectedMonthStr ?? "")
            ? "중복공유됩니다. 그래도 진행하시겠습니까?"
            : "업체들에게 정산내역을 공유하시겠습니까?"}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsShareModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                let settlementList = [];
                for (let i = 0; i < items.length; i++) {
                  if (itemsChecked[i]) {
                    settlementList.push(items[i]);
                  }
                }
                if (settlementList.length > 0) {
                  submitAddSettlements(settlementList);
                } else {
                  setNoticeModalStr("선택된 정산내역이 없습니다.");
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
        <SettlementTableMemo
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
            <ShareButton onClick={() => setIsShareModalOpened(true)}>
              정산 내역 공유
            </ShareButton>
          </div>
        ) : (
          <></>
        )}
        <Space h={20} />
        <div>{`* 할인은 '주문서 수정 > 할인내역 추가'에서 등록한 할인내역을 바탕으로 정산내역 공유 후 적용됩니다.`}</div>
        <div>
          {`* `}
          <span style={{ color: "red" }}>*</span>
          {`로 표시된 항목은 엑셀 내 모든 항목에 필수적으로 기입되야 합니다.`}
        </div>
      </PageLayout>
    </>
  );
}
