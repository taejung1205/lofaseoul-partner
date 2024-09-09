import { PageLayout } from "~/components/page_layout";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { BasicModal, ModalButton } from "~/components/modal";
import { OrderItem, OrderTable } from "~/components/order";
import { requireUser } from "~/services/session.server";
import { LoadingOverlay } from "@mantine/core";
import { BlackBottomButton } from "~/components/button";
import { useViewportSize } from "@mantine/hooks";
import { isMobile } from "~/utils/mobile";
import {
  getPartnerDelayedOrders,
  shareDelayedWaybills,
} from "~/services/firebase/delayedOrder.server";

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

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "share") {
    const waybills = body.get("waybill")?.toString();
    if (waybills !== undefined) {
      const jsonArr: OrderItem[] = JSON.parse(waybills);
      const result = await shareDelayedWaybills({
        waybills: jsonArr,
      });
      if (result == true) {
        return json({ message: `운송장 입력이 완료되었습니다.` });
      } else {
        return json({
          message: `운송장 입력 중 문제가 발생했습니다.${"\n"}${result}`,
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

  const orders = await getPartnerDelayedOrders(partnerName);
  return json({ orders: orders });
};

export default function PartnerDelayedOrder() {
  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 주문건 index 배열
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 주문건 아이템 리스트

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);

  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const viewportSize = useViewportSize();

  const isMobileMemo: boolean = useMemo(() => {
    return isMobile(viewportSize.width);
  }, [viewportSize]);

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

  //체크박스로 선택된 주문건 업뎃합니다. (삭제, 수정 버튼 클릭시 발생)
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

  function shareWaybill(waybillList: OrderItem[]) {
    const json = JSON.stringify(waybillList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("waybill", json);
    formData.set("action", "share");
    submit(formData, { method: "post" });
  }

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length ?? 0).fill(isChecked));
  }

  function onItemShippingCompanySelect(index: number, shippingCompany: string) {
    items[index].shippingCompany = shippingCompany;
  }

  function onItemWaybillNumberEdit(index: number, waybillNumber: string) {
    items[index].waybillNumber = waybillNumber;
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

      {/* 운송장 모달 */}
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
          {`선택한 운송장 ${selectedItems.length}건을 공유하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsShareModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                shareWaybill(selectedItems);
                setIsShareModalOpened(false);
              }}
            >
              공유
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      <PageLayout isMobile={isMobileMemo}>
        {loaderData.error == undefined ? (
          items.length > 0 ? (
            <>
              <OrderTable
                items={items}
                itemsChecked={itemsChecked}
                onItemCheck={onItemCheck}
                onCheckAll={onCheckAll}
                isDelayedOrder={true}
                isWaybillEdit={true}
                defaultAllCheck={false}
                onItemShippingCompanySelect={onItemShippingCompanySelect}
                onItemWaybillNumberEdit={onItemWaybillNumberEdit}
              />
              <div style={{ height: "20px" }} />
              <div
                style={{
                  width: isMobileMemo ? "100%" : "220px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <BlackBottomButton
                  onClick={() => {
                    const updatedList = updateCheckedItems();
                    if (updatedList == null) {
                      setNoticeModalStr(
                        "선택한 항목의 택배사, 송장번호를 확인해주세요."
                      );
                      setIsNoticeModalOpened(true);
                    } else {
                      if (updatedList.length == 0) {
                        setNoticeModalStr("선택된 주문건이 없습니다.");
                        setIsNoticeModalOpened(true);
                      } else {
                        setIsShareModalOpened(true);
                      }
                    }
                  }}
                >
                  운송장 공유
                </BlackBottomButton>
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
