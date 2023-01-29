import { PageLayout } from "~/components/page_layout";

import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { OrderItem, OrderTable } from "~/components/order";
import styled from "styled-components";
import { getAllDelayedOrders } from "~/services/firebase.server";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const SendNoticeButton = styled.button`
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

export const action: ActionFunction = async ({ request }) => {
  // const body = await request.formData();
  // const actionType = body.get("action")?.toString();
  // if (actionType === "delete") {
  //   const orders = body.get("order")?.toString();
  //   const day = body.get("day")?.toString();
  //   if (orders !== undefined && day !== undefined) {
  //     const jsonArr: OrderItem[] = JSON.parse(orders);
  //     await deleteOrders({
  //       orders: jsonArr,
  //       dayStr: day,
  //     });
  //     return redirect(encodeURI(`/admin/order-list?day=${day}`));
  //   }
  // }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const orders = await getAllDelayedOrders();
  return json({ orders: orders });
};

export default function AdminDelayedOrder() {
  const [errorModalStr, setErrorModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 정산내역 아이템 리스트

  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isErrorModalOpened, setIsErrorModalOpened] = useState<boolean>(false);

  const submit = useSubmit();
  const loaderData = useLoaderData();

  //loaderData에서 불러온 에러 정보를 바탕으로 한 에러 메세지
  const errorOrderStr = useMemo(() => {
    if (loaderData.error == undefined) {
      return null;
    }

    switch (loaderData.error) {
    }
    return "알 수 없는 오류입니다.";
  }, [loaderData]);

  useEffect(() => {
    if (loaderData.error == undefined) {
      setItems(loaderData.orders);
    }
  }, [loaderData]);

  //체크박스로 선택된 정산내역을 업뎃합니다. (삭제, 수정 버튼 클릭시 발생)
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
      {/* 안내용 모달 */}
      <BasicModal
        opened={isErrorModalOpened}
        onClose={() => setIsErrorModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {errorModalStr}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsErrorModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      {/* 알림 발송 모달 */}
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
          {`선택된 주문 ${selectedItems.length}건에 대한 알림을 발송하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                //submitDelete(selectedItems);
                setIsDeleteModalOpened(false);
              }}
            >
              발송
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      <PageLayout>
        {loaderData.error == undefined ? (
          items.length > 0 ? (
            <>
              <OrderTable
                items={items}
                itemsChecked={itemsChecked}
                onItemCheck={onItemCheck}
                onCheckAll={onCheckAll}
                isDelayedOrder={true}
                defaultAllCheck={false}
              />
              <div style={{ height: "20px" }} />
              <div
                style={{
                  width: "inherit",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <SendNoticeButton
                  onClick={() => {
                    const updatedList = updateCheckedItems();
                    if (updatedList.length > 0) {
                      setIsDeleteModalOpened(true);
                    } else {
                      setErrorModalStr("선택된 정산내역이 없습니다.");
                      setIsErrorModalOpened(true);
                    }
                  }}
                >
                  긴급 알림 보내기
                </SendNoticeButton>
              </div>
            </>
          ) : (
            <EmptySettlementBox>남아있는 주문건이 없습니다.</EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorOrderStr}</EmptySettlementBox>
        )}
      </PageLayout>
    </>
  );
}
