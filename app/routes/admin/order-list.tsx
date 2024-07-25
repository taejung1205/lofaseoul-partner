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
import { CommonButton } from "~/components/button";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { OrderItem, OrderTable } from "~/components/order";
import { deleteOrders, getAllOrders } from "~/services/firebase.server";
import { LoadingOverlay, Space } from "@mantine/core";

interface EmptySettlementBoxProps extends React.HTMLProps<HTMLDivElement> {}

const EmptySettlementBox: React.FC<EmptySettlementBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "24px",
    height: "100px",
    alignItems: "center",
    justifyContent: "center",
    width: "inherit",
  };

  return <div style={styles} {...props} />;
};

interface DeleteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DeleteButton: React.FC<DeleteButtonProps> = (props) => {
  const styles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "220px",
    height: "50px",
    lineHeight: "1",
    padding: "6px",
    marginRight: "40px",
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
};

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "delete") {
    const orders = body.get("order")?.toString();
    const day = body.get("day")?.toString();
    if (orders !== undefined && day !== undefined) {
      const jsonArr: OrderItem[] = JSON.parse(orders);
      const result = await deleteOrders({
        orders: jsonArr,
        dayStr: day,
      });
      if (result == true) {
        return json({ message: "삭제가 완료되었습니다." });
      } else {
        return json({
          message: `삭제 중 문제가 발생했습니다.${"\n"}${result}`,
        });
      }
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const day = url.searchParams.get("day");
  console.log(day);

  if (day !== null) {
    const orders = await getAllOrders(day);
    return json({ day: day, orders: orders });
  } else {
    const today = dateToDayStr(new Date());
    const orders = await getAllOrders(today);
    return json({ day: today, orders: orders });
  }
};

export default function AdminOrderList() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 주문건 index 배열
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 주문건 아이템 리스트

  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();
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
      setItems(loaderData.orders);
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  //주문건 삭제를 post합니다.
  function submitDelete(orderList: OrderItem[]) {
    const json = JSON.stringify(orderList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("order", json);
    formData.set("day", loaderData.day);
    formData.set("action", "delete");
    submit(formData, { method: "post" });
  }

  //체크박스로 선택된 주문내역을 업뎃합니다. (삭제, 수정 버튼 클릭시 발생)
  // 수정된 리스트를 반환합니다.
  function updateCheckedItems() {
    let settlementList = [];
    for (let i = 0; i < items.length; i++) {
      if (itemsChecked[i]) {
        settlementList.push(items[i]);
      }
    }
    setSelectedItems(settlementList);
    return settlementList;
  }

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length ?? 0).fill(isChecked));
  }

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      {/* 안내용 모달 */}
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
            <ModalButton
              onClick={() => {
                setIsNoticeModalOpened(false);
              }}
            >
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      {/* 주문내역 삭제 모달 */}
      <BasicModal
        opened={isDeleteModalOpened}
        onClose={() => setIsDeleteModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`선택된 주문건 ${selectedItems.length}건을 삭제하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                submitDelete(selectedItems);
                setIsDeleteModalOpened(false);
              }}
            >
              삭제
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      <PageLayout>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <Space w={20} />
          <DaySelectPopover
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          <Space w={20} />
          <Link to={`/admin/order-list?day=${selectedDayStr}`}>
            <CommonButton>조회하기</CommonButton>
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
              />
              <div style={{ height: "20px" }} />
              <DeleteButton
                onClick={() => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length > 0) {
                    setIsDeleteModalOpened(true);
                  } else {
                    setNoticeModalStr("선택된 주문건이 없습니다.");
                    setIsNoticeModalOpened(true);
                  }
                }}
              >
                선택 주문서 삭제
              </DeleteButton>
            </>
          ) : (
            <EmptySettlementBox>
              주문내역이 존재하지 않습니다.
            </EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorOrderStr}</EmptySettlementBox>
        )}
      </PageLayout>
    </>
  );
}
