import { PageLayout } from "~/components/page_layout";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  dateToDayStr,
  DaySelectPopover,
  dayStrToDate,
  getTimezoneDate,
} from "~/components/date";
import { GetListButton } from "~/components/button";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { OrderItem, OrderTable } from "~/components/order";
import styled from "styled-components";
import { editWaybills, getPartnerWaybills } from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { requireUser } from "~/services/session.server";
import { LoadingOverlay } from "@mantine/core";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const EditButton = styled.button`
  background-color: black;
  color: white;
  font-size: 24px;
  font-weight: 700;
  width: 220px;
  height: 50px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  margin-right: 40px;
  cursor: pointer;
`;

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "share") {
    const waybills = body.get("waybill")?.toString();
    const day = body.get("day")?.toString();
    if (waybills !== undefined && day !== undefined) {
      const jsonArr: OrderItem[] = JSON.parse(waybills);
      const result = await editWaybills({
        waybills: jsonArr,
        dayStr: day,
      });

      if (result == true) {
        return json({ message: `운송장 수정이 완료되었습니다.` });
      } else {
        return json({
          message: `운송장 수정 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  const user = await requireUser(request);
  if (user !== null) {
    partnerName = user.uid;
  } else {
    return redirect("/logout");
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("day");

  if (day !== null) {
    const waybills = await getPartnerWaybills({
      dayStr: day,
      partnerName: partnerName,
    });
    return json({ day: day, waybills: waybills, name: partnerName });
  } else {
    const today = dateToDayStr(new Date());
    const waybills = await getPartnerWaybills({
      dayStr: today,
      partnerName: partnerName,
    });
    return json({ day: today, waybills: waybills, name: partnerName });
  }
};

export default function AdminOrderList() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 정산내역 아이템 리스트

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);

  const submit = useSubmit();
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();

  const selectedDayStr = useMemo(
    () => dateToDayStr(selectedDate ?? new Date()),
    [selectedDate]
  );

  //loaderData에서 불러온 에러 정보를 바탕으로 한 에러 메세지
  const errorOrderStr = useMemo(() => {
    if (loaderData.error == undefined) {
      return null;
    }

    switch (loaderData.error) {
      case "day null":
        return `날짜 정보가 잘못되었습니다. 다시 조회해주세요.`;
    }
    return "알 수 없는 오류입니다.";
  }, [loaderData]);

  //날짜 수신
  useEffect(() => {
    if (loaderData.error !== undefined) {
      setSelectedDate(getTimezoneDate(new Date()));
    } else {
      setSelectedDate(dayStrToDate(loaderData.day));
    }
  }, []);

  useEffect(() => {
    if (loaderData.error == undefined) {
      setItems(loaderData.waybills);
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  function shareWaybill(waybillList: OrderItem[], dayStr: string) {
    const json = JSON.stringify(waybillList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("waybill", json);
    formData.set("day", dayStr);
    formData.set("action", "share");
    submit(formData, { method: "post" });
  }

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length).fill(isChecked));
  }

  function onItemShippingCompanySelect(index: number, shippingCompany: string) {
    items[index].shippingCompany = shippingCompany;
  }

  function onItemWaybillNumberEdit(index: number, waybillNumber: string) {
    items[index].waybillNumber = waybillNumber;
  }

  //체크박스로 선택된 정산내역을 업뎃합니다. (삭제, 수정 버튼 클릭시 발생)
  // 수정된 리스트를 반환합니다.
  // 만약 택배사 정보나 송장번호가 비어있는 아이템이 있다면, 대신 null을 반환합니다.
  function updateCheckedItems() {
    let waybillList = [];
    for (let i = 0; i < items.length; i++) {
      if (itemsChecked[i]) {
        if (
          items[i].shippingCompany.length == 0 ||
          items[i].waybillNumber.length == 0
        ) {
          return null;
        }
        waybillList.push(items[i]);
      }
    }
    setSelectedItems(waybillList);
    return waybillList;
  }
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
        onClose={() => setIsShareModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`선택한 운송장 ${selectedItems.length}건을 수정 및 재공유하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsShareModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                shareWaybill(selectedItems, loaderData.day);
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
          <DaySelectPopover
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          <Link to={`/partner/shipped-list?day=${selectedDayStr}`}>
            <GetListButton>조회하기</GetListButton>
          </Link>
        </div>

        <div style={{ height: "20px" }} />
        {loaderData.error == undefined ? (
          items.length > 0 ? (
            <>
              <OrderTable
                items={items}
                itemsChecked={itemsChecked}
                onItemCheck={onItemCheck}
                onCheckAll={onCheckAll}
                defaultAllCheck={false}
                isWaybillEdit={true}
                onItemShippingCompanySelect={onItemShippingCompanySelect}
                onItemWaybillNumberEdit={onItemWaybillNumberEdit}
              />
              <div style={{ height: "20px" }} />
              <div
                style={{
                  width: "inherit",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <EditButton
                  onClick={() => {
                    const updatedList = updateCheckedItems();
                    if (updatedList == null) {
                      setNoticeModalStr(
                        "선택한 항목의 택배사, 송장번호를 확인해주세요."
                      );
                      setIsNoticeModalOpened(true);
                    } else {
                      if (updatedList.length == 0) {
                        setNoticeModalStr("선택된 정산내역이 없습니다.");
                        setIsNoticeModalOpened(true);
                      } else {
                        setIsShareModalOpened(true);
                      }
                    }
                  }}
                >
                  수정 재전송
                </EditButton>
              </div>
            </>
          ) : (
            <EmptySettlementBox>
              정산내역이 존재하지 않습니다.
            </EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorOrderStr}</EmptySettlementBox>
        )}
      </PageLayout>
    </>
  );
}
