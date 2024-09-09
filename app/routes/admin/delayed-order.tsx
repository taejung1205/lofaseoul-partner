import { PageLayout } from "~/components/page_layout";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { OrderItem, OrderTable } from "~/components/order";
import { getPartnerProfile } from "~/services/firebase/firebase.server";
import { sendAligoMessage } from "~/services/aligo.server";
import { LoadingOverlay } from "@mantine/core";
import { getAllDelayedOrders } from "~/services/firebase/delayedOrder.server";

function EmptySettlementBox({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const boxStyles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "24px",
    height: "100px",
    alignItems: "center",
    justifyContent: "center",
    width: "inherit",
  };

  return (
    <div style={boxStyles} {...props}>
      {children}
    </div>
  );
}

function SendNoticeButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonStyles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "220px",
    height: "50px",
    lineHeight: 1,
    padding: "6px",
    marginRight: "40px",
    cursor: "pointer",
  };

  return (
    <button style={buttonStyles} {...props}>
      {children}
    </button>
  );
}
export const action: ActionFunction = async ({ request }) => {
  try {
    const body = await request.formData();
    const actionType = body.get("action")?.toString();
    if (actionType === "send") {
      const receivers = body.get("receivers")?.toString();
      if (receivers !== undefined) {
        const receiversArr: string[] = JSON.parse(receivers);
        for (let i = 0; receiversArr.length; i++) {
          const profile: any = await getPartnerProfile({
            name: receiversArr[i],
          });
          if (profile == null || profile.phone == undefined) {
            throw Error("해당 파트너를 찾을 수 없습니다.");
          } else {
            const phone = profile.phone;
            const response = await sendAligoMessage({
              text: `[로파파트너] 현재 운송장 입력이 지연된 주문건이 있습니다. 확인 부탁드립니다.`,
              receiver: phone,
            });
            if (
              response.result_code !== undefined &&
              response.result_code == 1
            ) {
              return json({ message: `메세지가 전송되었습니다.` });
            } else {
              throw Error(response.message);
            }
          }
        }
      }
    }
  } catch (error: any) {
    return json({
      message: `메세지 전송 중 오류가 발생했습니다. ${error.message ?? error}`,
    });
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const orders = await getAllDelayedOrders();
  return json({ orders: orders });
};

export default function AdminDelayedOrder() {
  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 정산내역 아이템 리스트

  const [isSendModalOpened, setIsSendModalOpened] = useState<boolean>(false);
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const actionData = useActionData();
  const submit = useSubmit();
  const loaderData = useLoaderData();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();

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

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

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

  function sendMessage() {
    const receiverList: string[] = [];

    for (let i = 0; i < items.length; i++) {
      if (itemsChecked[i]) {
        const partner = items[i].partnerName;
        if (!receiverList.includes(partner)) {
          receiverList.push(partner);
        }
      }
    }

    if (receiverList.length == 0) {
      setNoticeModalStr("수신 대상이 없습니다.");
      setIsNoticeModalOpened(true);
      return null;
    }
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("receivers", JSON.stringify(receiverList));
    formData.set("action", "send");
    submit(formData, { method: "post" });
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
            <ModalButton onClick={() => setIsNoticeModalOpened(false)}>
              확인
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      {/* 알림 발송 모달 */}
      <BasicModal
        opened={isSendModalOpened}
        onClose={() => setIsSendModalOpened(false)}
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
            <ModalButton onClick={() => setIsSendModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                sendMessage();
                setIsSendModalOpened(false);
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
                      setIsSendModalOpened(true);
                    } else {
                      setNoticeModalStr("선택된 정산내역이 없습니다.");
                      setIsNoticeModalOpened(true);
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
