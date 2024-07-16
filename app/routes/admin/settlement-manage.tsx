import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { BlackButton, CommonButton, GetListButton } from "~/components/button";
import {
  MonthSelectPopover,
  dateToKoreanMonth,
  dateToNumeralMonth,
  numeralMonthToKorean,
  getTimezoneDate,
  koreanMonthToDate,
} from "~/components/date";
import { PageLayout } from "~/components/page_layout";
import { SellerSelect } from "~/components/seller";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
  SettlementSumItem,
  SettlementSumTable,
} from "~/components/settlement_sum";
import {
  getAllSettlementSum,
  sendSettlementNoticeEmail,
} from "~/services/firebase.server";
import writeXlsxFile from "write-excel-file";
import { LoadingOverlay, Space } from "@mantine/core";
import { BasicModal, ModalButton } from "~/components/modal";
import { sendResendEmail } from "~/services/resend.server";

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const numeralMonth = url.searchParams.get("month");

  if (numeralMonth !== null) {
    const monthStr = numeralMonthToKorean(numeralMonth);
    const sums = await getAllSettlementSum({
      monthStr: monthStr,
    });
    return json({ sums: sums, numeralMonth: numeralMonth });
  } else {
    return null;
  }
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  switch (actionType) {
    case "send-email":
      const partnerList = body.get("partners")?.toString();
      const partners = JSON.parse(partnerList ?? "");
      const result = await sendSettlementNoticeEmail({
        partnerList: partners,
      });
      if (result.status == "error") {
        return {
          status: "error",
          message: `${result.partnerName}에게 메일 전송 중에 오류가 발생했습니다.\n${result.message}`,
        };
      } else {
        return { status: "ok", message: "메일 전송을 완료하였습니다." };
      }
      break;
  }

  return null;
};

export default function AdminSettlementManage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [seller, setSeller] = useState<string>("all");

  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isSendEmailConfirmModalOpened, setIsSendEmailConfirmModalOpened] =
    useState<boolean>(false);

  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  const selectedMonthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  const sumItems: SettlementSumItem[] = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const totalSum = useMemo(() => {
    if (sumItems == null) {
      return null;
    } else {
      let settlementSum = 0;
      let shippingSum = 0;
      if (seller == "all") {
        sumItems.forEach((item) => {
          const sum = getAllSellerSettlementSum(item.data);
          settlementSum += sum.settlement;
          shippingSum += sum.shippingFee;
        });
      } else {
        sumItems.forEach((item) => {
          settlementSum += item.data[`settlement_${seller}`];
          shippingSum += item.data[`shipping_${seller}`];
        });
      }
      return {
        settlement: settlementSum,
        shippingFee: shippingSum,
      };
    }
  }, [sumItems, seller]);

  useEffect(() => {
    if (loaderData && loaderData.numeralMonth) {
      setSelectedDate(
        koreanMonthToDate(numeralMonthToKorean(loaderData.numeralMonth))
      );
    } else {
      setSelectedDate(getTimezoneDate(new Date()));
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  async function writeExcel(sumItems: SettlementSumItem[]) {
    const copy = sumItems.map((item) => item);
    const totalSumItem: SettlementSumItem = {
      partnerName: "합계",
      data: totalSum,
      brn: "",
      bankAccount: "",
    };
    copy.push(totalSumItem);
    await writeXlsxFile(copy, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `정산합계_${loaderData.numeralMonth}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  async function sendEmail() {
    const selectedPartners = updateCheckedItems();
    if (selectedPartners.length > 0) {
      if(selectedPartners.length <= 2){ 
        setIsSendEmailConfirmModalOpened(true);
      } else {
        setNoticeModalStr("현재는 한 번에 최대 2통의 메일을 보낼 수 있습니다.");
        setIsNoticeModalOpened(true);
      }
    } else {
      setNoticeModalStr("선택된 파트너가 없습니다.");
      setIsNoticeModalOpened(true);
    }
  }

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(sumItems.length ?? 0).fill(isChecked));
  }

  //체크박스로 선택된 파트너 목록을 업뎃합니다. 수정된 리스트를 반환합니다.
  function updateCheckedItems() {
    let selectedPartners = [];
    for (let i = 0; i < sumItems.length; i++) {
      if (itemsChecked[i]) {
        selectedPartners.push(sumItems[i].partnerName);
      }
    }
    setSelectedPartners(selectedPartners);
    return selectedPartners;
  }

  //안내메일 전송 요청을 post합니다.
  function submitSendEmail(partnerList: string[]) {
    const data = JSON.stringify(partnerList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("partners", data);
    formData.set("action", "send-email");
    submit(formData, { method: "post" });
  }

  return (
    <PageLayout>
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
            whiteSpace: "pre-line"
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

      {/* 메일 전송 확인 모달 */}
      <BasicModal
        opened={isSendEmailConfirmModalOpened}
        onClose={() => setIsSendEmailConfirmModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`선택된 파트너 ${selectedPartners.length}곳에 안내 메일을 전송하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton
              onClick={() => setIsSendEmailConfirmModalOpened(false)}
            >
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                submitSendEmail(selectedPartners);
                setIsSendEmailConfirmModalOpened(false);
              }}
            >
              전송
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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
          <Space w={20} />
          <Link to={`/admin/settlement-manage?month=${selectedMonthNumeral}`}>
            <CommonButton>조회하기</CommonButton>
          </Link>
          <Space w={20} />
          {sumItems == null || sumItems.length == 0 ? (
            <></>
          ) : (
            <>
              <CommonButton
                onClick={async () => {
                  await writeExcel(sumItems);
                }}
                width={180}
              >
                엑셀 다운로드
              </CommonButton>
              <Space w={20} />
              <CommonButton
                width={180}
                onClick={() => {
                  sendEmail();
                }}
              >
                안내메일 전송
              </CommonButton>
            </>
          )}
        </div>

        <SellerSelect seller={seller} setSeller={setSeller} />
      </div>
      <div style={{ height: "20px" }} />
      {sumItems == null ? (
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
      ) : sumItems.length > 0 ? (
        <SettlementSumTable
          items={sumItems}
          seller={seller}
          numeralMonth={loaderData.numeralMonth}
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
      {sumItems !== null && sumItems.length > 0 && totalSum !== null ? (
        <>
          <div style={{ height: "40px" }} />
          <SettlementSumBar
            seller={seller ?? "all"}
            settlement={totalSum?.settlement}
            shippingFee={totalSum?.shippingFee}
          />
        </>
      ) : (
        <></>
      )}
    </PageLayout>
  );
}

const schema = [
  {
    column: "업체명",
    type: String,
    value: (item: SettlementSumItem) => item.partnerName,
    width: 30,
    wrap: true,
  },
  {
    column: "사업자등록번호",
    type: String,
    value: (item: SettlementSumItem) => item.brn,
    width: 30,
    wrap: true,
  },
  {
    column: "계좌번호",
    type: String,
    value: (item: SettlementSumItem) => item.bankAccount,
    width: 30,
    wrap: true,
  },
  {
    column: "정산금액",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.settlement;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.settlement;
      }
    },
    width: 30,
  },
  {
    column: "배송비 별도 정산",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.shippingFee;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.shippingFee;
      }
    },
    width: 30,
  },
  {
    column: "최종 정산 금액",
    type: Number,
    value: (item: SettlementSumItem) => {
      if (item.partnerName == "합계") {
        return item.data.shippingFee + item.data.settlement;
      } else {
        const sum = getAllSellerSettlementSum(item.data);
        return sum.shippingFee + sum.settlement;
      }
    },
    width: 30,
  },
];
