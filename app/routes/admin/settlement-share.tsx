import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import * as xlsx from "xlsx";
import { dateToKoreanMonth, MonthSelectPopover } from "~/components/date";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { PartnerProfile } from "~/components/partner_profile";
import {
  isSettlementItemValid,
  setSettlementPartnerName,
  adjustSellerName,
  setSettlementFee,
  SettlementTableMemo,
} from "~/components/settlement_table";
import { SettlementItem } from "~/components/settlement_table";
import {
  addSettlements,
  getPartnerProfiles,
  getSettlementMonthes,
} from "~/services/firebase.server";

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

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "share") {
    const settlement = body.get("settlement")?.toString();
    const month = body.get("month")?.toString();
    if (settlement !== undefined && month !== undefined) {
      const jsonArr: SettlementItem[] = JSON.parse(settlement);
      console.log(jsonArr);
      await addSettlements({ settlements: jsonArr, monthStr: month });
      return json({ message: `${month} 정산내역 공유가 완료되었습니다.` });
    }
  }

  return null;
};

export let loader: LoaderFunction = async ({ request }) => {
  const monthes = await getSettlementMonthes();
  const partnersMap = await getPartnerProfiles();
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

  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const sharedMonthes: string[] = loaderData.monthes;
  const partnerProfiles = useMemo(() => {
    let map = new Map();
    loaderData.partners.forEach((partner: PartnerProfile) => {
      map.set(partner.name, partner);
    });
    return map;
  }, [loaderData]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setSelectedDate(new Date());
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

  function shareSettlement(settlementList: SettlementItem[]) {
    const json = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", json);
    formData.set("month", selectedMonthStr!);
    formData.set("action", "share");
    submit(formData, { method: "post" });
  }

  const readExcel = (e: any) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: SettlementItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: SettlementItem = {
            seller: element.판매처,
            orderNumber: element.주문번호,
            productName: element.상품명,
            optionName: element.옵션명 ?? "",
            price: element.판매단가,
            amount: element.수량,
            orderer: element.주문자,
            receiver: element.수령자,
            partnerName: "",
            fee: -1,
            shippingFee: -1,
          };

          let isValid = isSettlementItemValid(item);
          if (!isValid) {
            setNoticeModalStr("유효하지 않은 엑셀 파일입니다.");
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          adjustSellerName(item);

          let nameResult = setSettlementPartnerName(item);
          if (!nameResult || item.partnerName.length == 0) {
            setNoticeModalStr(
              "유효하지 않은 엑셀 파일입니다.\n상품명에 파트너 이름이 들어있는지 확인해주세요."
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          const partnerProfile = partnerProfiles.get(item.partnerName);
          if (partnerProfile === undefined) {
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다.\n상품명의 파트너가 계약 업체 목록에 있는지 확인해주세요. (${item.partnerName})`
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          setSettlementFee(item, partnerProfile);

          array.push(item);
        }
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <>
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
                  shareSettlement(settlementList);
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
      </PageLayout>
    </>
  );
}
