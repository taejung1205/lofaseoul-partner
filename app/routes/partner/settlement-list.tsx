import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  dateToKoreanMonth,
  MonthSelectPopover,
  dateToNumeralMonth,
  numeralMonthToKorean,
  getTimezoneDate,
} from "~/components/date";
import { PossibleSellers, SellerSelect } from "~/components/seller";
import {
  SettlementItem,
  SettlementTableMemo,
} from "~/components/settlement_table";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
} from "~/components/settlement_sum";
import { getSettlements, getSettlementSum } from "~/services/firebase.server";
import { PageLayout } from "~/components/page_layout";
import { CommonButton, GetListButton } from "~/components/button";
import { requireUser } from "~/services/session.server";
import { sendAligoMessage } from "~/services/aligo.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { LoadingOverlay, Space } from "@mantine/core";
import writeXlsxFile from "write-excel-file";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const ReportButton = styled.button`
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

const InfoText = styled.text`
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  padding: 6px 6px 6px 6px;
`;

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "send") {
    const text = body.get("text")?.toString();
    const receiver = "01021629843";
    if (text !== undefined) {
      const response = await sendAligoMessage({
        text: text,
        receiver: receiver,
      });
      if (response.result_code !== undefined && response.result_code == 1) {
        return json({ message: `메세지가 전송되었습니다.` });
      } else {
        return json({ message: `메세지 전송 중 오류가 발생했습니다.` });
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
  const month = url.searchParams.get("month");
  if (month !== null) {
    const monthStr = numeralMonthToKorean(month);
    const settlements = await getSettlements({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    const sums = await getSettlementSum({
      partnerName: partnerName,
      monthStr: monthStr,
    });
    return json({
      settlements: settlements,
      sums: sums,
      partnerName: partnerName,
      monthStr: monthStr,
    });
  } else {
    return null;
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [seller, setSeller] = useState<string>("all");

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isSendModalOpened, setIsSendModalOpened] = useState<boolean>(false);

  const actionData = useActionData();
  const loaderData = useLoaderData();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();

  const monthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  const settlements: SettlementItem[] | null = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.settlements;
    }
  }, [loaderData]);

  const sums = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const allSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      return getAllSellerSettlementSum(sums);
    }
  }, [sums]);

  useEffect(() => {
    setSelectedDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    if (settlements !== null) {
      if (seller == "all") {
        setItems(settlements);
      } else if (seller == "etc") {
        const newItems = settlements.filter(
          (item) => !PossibleSellers.includes(item.seller)
        );
        setItems(newItems);
      } else {
        const newItems = settlements.filter((item) => item.seller == seller);
        setItems(newItems);
      }
      const newChecked = Array(items.length).fill(false);
      setItemsChecked(newChecked);
    }
  }, [settlements, seller]);

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
    setItemsChecked(Array(items.length ?? 0).fill(isChecked));
  }

  function sendMessage() {
    let orderNumberList: string[] = [];
    for (let i = 0; i < items.length; i++) {
      if (itemsChecked[i]) {
        orderNumberList.push(items[i].orderNumber);
      }
    }
    if (orderNumberList.length == 0) {
      setNoticeModalStr("선택된 운송장이 없습니다.");
      setIsNoticeModalOpened(true);
      return null;
    }

    let orderNumberListStr = `${orderNumberList[0]}`;
    for (let i = 1; i < orderNumberList.length; i++) {
      orderNumberListStr += `, ${orderNumberList[i]}`;
    }
    const text = `[${loaderData.partnerName}]이 ${loaderData.monthStr}에 공유된 정산건 중 [${orderNumberListStr}]에 대해 오류를 보고하였습니다. 내용을 확인 부탁드립니다.`;
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("text", text);
    formData.set("action", "send");
    submit(formData, { method: "post" });
  }

  async function writeExcel() {
    await writeXlsxFile(items, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `정산내역_${loaderData.monthStr}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
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
        opened={isSendModalOpened}
        onClose={() => setIsSendModalOpened}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`선택된 정산건에 대해 오류를 보고하시겠습니까?`}

          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsSendModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                sendMessage();
                setIsSendModalOpened(false);
              }}
            >
              공유
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      <PageLayout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "inherit",
          }}
        >
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
            <Link to={`/partner/settlement-list?month=${monthNumeral}`}>
              <GetListButton>조회하기</GetListButton>
            </Link>
            <Space w={20} />
            <CommonButton width={180} onClick={() => writeExcel()}>
              엑셀 다운로드
            </CommonButton>
          </div>

          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {settlements == null ? (
          <EmptySettlementBox
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: "30px",
              height: "100px",
              alignItems: "center",
              justifyContent: "center",
              width: "inherit",
            }}
          >
            조회하기 버튼을 클릭하여 정산내역을 확인할 수 있습니다.
          </EmptySettlementBox>
        ) : items.length > 0 ? (
          <SettlementTableMemo
            items={items}
            itemsChecked={itemsChecked}
            onItemCheck={onItemCheck}
            onCheckAll={onCheckAll}
            defaultAllCheck={false}
          />
        ) : (
          <EmptySettlementBox
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: "30px",
              height: "100px",
              alignItems: "center",
              justifyContent: "center",
              width: "inherit",
            }}
          >
            공유된 정산내역이 없습니다.
          </EmptySettlementBox>
        )}
        {items.length > 0 && allSum !== null ? (
          <>
            <div style={{ height: "20px" }} />
            <InfoText>{`* 합배송 정산내역에 대한 배송비는 중복으로 적용되지 않습니다. (주문번호가 동일한 경우)`}</InfoText>
            <div style={{ height: "20px" }} />
            <div style={{ display: "flex", alignItems: "center" }}>
              <ReportButton
                onClick={() => {
                  setIsSendModalOpened(true);
                }}
              >
                오류 보고
              </ReportButton>
              <div style={{ marginLeft: "30px" }}>
                다량의 오류가 보일 시에는 kyj@tabacpress.xyz로 문의
                부탁드립니다.
              </div>
            </div>

            <div style={{ height: "20px" }} />

            <SettlementSumBar
              seller={seller ?? "all"}
              settlement={
                seller == "all"
                  ? allSum.settlement
                  : sums[`settlement_${seller}`] ?? 0
              }
              shippingFee={
                seller == "all"
                  ? allSum.shippingFee
                  : sums[`shipping_${seller}`] ?? 0
              }
            />
          </>
        ) : (
          <></>
        )}
      </PageLayout>
    </>
  );
}

const schema = [
  {
    column: "판매처",
    type: String,
    value: (item: SettlementItem) => item.seller,
    width: 15,
    wrap: true,
  },
  {
    column: "주문번호",
    type: String,
    value: (item: SettlementItem) => item.orderNumber,
    width: 30,
    wrap: true,
  },
  {
    column: "상품명",
    type: String,
    value: (item: SettlementItem) => {
      return item.productName;
    },
    width: 60,
    wrap: true,
  },
  {
    column: "옵션명",
    type: String,
    value: (item: SettlementItem) => item.optionName,
    width: 30,
  },
  {
    column: "판매단가",
    type: Number,
    value: (item: SettlementItem) => {
      return Number(item.price);
    },
    width: 15,
  },
  {
    column: "수량",
    type: Number,
    value: (item: SettlementItem) => {
      return Number(item.amount);
    },
    width: 10,
  },
  {
    column: "주문자",
    type: String,
    value: (item: SettlementItem) => item.orderer,
    width: 10,
  },
  {
    column: "송신자",
    type: String,
    value: (item: SettlementItem) => item.receiver,
    width: 10,
  },
  {
    column: "세일반영",
    type: Number,
    value: (item: SettlementItem) => item.sale,
    width: 10,
  },
  {
    column: "주문태그",
    type: String,
    value: (item: SettlementItem) => item.orderTag,
    width: 10,
  },
];
