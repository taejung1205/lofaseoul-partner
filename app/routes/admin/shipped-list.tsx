import { PageLayout } from "~/components/page_layout";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "@remix-run/react";
import {
  dateToDayStr,
  DaySelectPopover,
  dayStrToDate,
  getTimezoneDate,
} from "~/components/date";
import { GetListButton } from "~/components/button";
import { json, LoaderFunction } from "@remix-run/node";
import { OrderItem, OrderTable } from "~/components/order";
import styled from "styled-components";
import {
  getAllWaybills,
  getPartnerProfile,
  getPartnerWaybills,
} from "~/services/firebase.server";
import { PossibleSellers, SellerSelect } from "~/components/seller";
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

const DownloadButton = styled.button`
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

const SellerInputBox = styled.input`
  width: 140px;
  height: 40px;
  border: 3px solid black;
  padding: 6px;
  text-align: left;
  font-size: 20px;
  font-weight: 700;
  margin-left: 20px;
  ::placeholder {
    color: black;
    font-weight: 700;
    opacity: 1;
  }
  :focus::placeholder {
    color: transparent;
  }
`;

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  let day = url.searchParams.get("day");
  const partnerName = url.searchParams.get("partner");

  if (day == null) {
    day = dateToDayStr(new Date());
  }

  if (partnerName !== null) {
    const checkPartner = await getPartnerProfile({ name: partnerName });
    if (checkPartner == null) {
      return json({
        error: "partner",
        partnerName: partnerName,
        day: day,
        waybills: [],
      });
    }
    const waybills = await getPartnerWaybills({
      dayStr: day,
      partnerName: partnerName,
    });

    return json({ day: day, waybills: waybills, partnerName: partnerName });
  } else {
    const waybills = await getAllWaybills(day);

    return json({ day: day, waybills: waybills, partnerName: partnerName });
  }
};

export default function AdminShippedList() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 정산내역 아이템 리스트
  const [seller, setSeller] = useState<string>("all"); //판매처
  const [partnerName, setPartnerName] = useState<string>(""); //파트너명 (조회된 파트너명으로 시작, 입력창으로 수정 및 조회)

  const loaderData = useLoaderData();

  const selectedDayStr = useMemo(
    () => dateToDayStr(selectedDate ?? new Date()),
    [selectedDate]
  );

  const waybills: OrderItem[] | null = useMemo(() => {
    if (loaderData == null) {
      return null;
    } else {
      return loaderData.waybills;
    }
  }, [loaderData]);

  //loaderData에서 불러온 에러 정보를 바탕으로 한 에러 메세지
  const errorOrderStr = useMemo(() => {
    if (loaderData.error == undefined) {
      return null;
    }

    switch (loaderData.error) {
      case "partner":
        if (
          loaderData.partnerName == undefined ||
          loaderData.partnerName == "undefined"
        ) {
          return `파트너 정보가 잘못되었습니다. 다시 조회해주세요. `;
        } else {
          return `파트너명(${loaderData.partnerName})이 유효하지 않습니다.`;
        }
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
    if (waybills !== null && waybills !== undefined) {
      if (seller == "all") {
        setItems(waybills);
      } else if (seller == "etc") {
        const newItems = waybills.filter(
          (item: OrderItem) => !PossibleSellers.includes(item.seller)
        );
        setItems(newItems);
      } else {
        const newItems = waybills.filter(
          (item: OrderItem) => item.seller == seller
        );
        setItems(newItems);
      }
    }
  }, [loaderData, seller]);

  async function writeExcel() {
    const schema = [
      {
        column: "판매처",
        type: String,
        value: (item: OrderItem) => item.seller,
        width: 15,
        wrap: true,
      },
      {
        column: "주문번호",
        type: String,
        value: (item: OrderItem) => item.orderNumber,
        width: 30,
        wrap: true,
      },
      {
        column: "상품명",
        type: String,
        value: (item: OrderItem) => item.productName,
        width: 60,
        wrap: true,
      },
      {
        column: "옵션명",
        type: String,
        value: (item: OrderItem) => item.optionName,
        width: 30,
      },
      {
        column: "배송수량",
        type: Number,
        value: (item: OrderItem) => item.amount,
        width: 10,
      },
      {
        column: "우편번호",
        type: String,
        value: (item: OrderItem) => item.zipCode,
        width: 10,
      },
      {
        column: "주소",
        type: String,
        value: (item: OrderItem) => item.address,
        width: 60,
        wrap: true,
      },
      {
        column: "연락처",
        type: String,
        value: (item: OrderItem) => item.phone,
        width: 15,
      },
      {
        column: "수취인",
        type: String,
        value: (item: OrderItem) => item.receiver,
        width: 10,
      },
      {
        column: "택배사명",
        type: String,
        value: (item: OrderItem) => item.shippingCompany,
        width: 15,
      },
      {
        column: "송장번호",
        type: String,
        value: (item: OrderItem) => item.waybillNumber,
        width: 15,
      },
      {
        column: "주문자명",
        type: String,
        value: (item: OrderItem) => item.orderer,
        width: 10,
      },
      {
        column: "주문자 전화번호",
        type: String,
        value: (item: OrderItem) => item.ordererPhone,
        width: 15,
      },
      {
        column: "통관부호",
        type: String,
        value: (item: OrderItem) => item.customsCode,
        width: 15,
      },
      {
        column: "배송요청사항",
        type: String,
        value: (item: OrderItem) => item.deliveryRequest,
        width: 30,
        wrap: true,
      },
      {
        column: "관리번호",
        type: String,
        value: (item: OrderItem) => item.managementNumber,
        width: 15,
      },
    ];

    await writeXlsxFile(items, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `배송완료내역_${loaderData.day}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  return (
    <>
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
            <DaySelectPopover
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <SellerInputBox
              type="text"
              name="name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Link
              to={
                partnerName.length > 0
                  ? `/admin/shipped-list?day=${selectedDayStr}&partner=${partnerName}`
                  : `/admin/shipped-list?day=${selectedDayStr}`
              }
            >
              <GetListButton>조회하기</GetListButton>
            </Link>
          </div>
          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.error == undefined ? (
          items !== undefined && items.length > 0 ? (
            <>
              <OrderTable
                items={items}
                itemsChecked={[]}
                onItemCheck={() => {}}
                onCheckAll={() => {}}
                isWaybill={true}
                checkboxRequired={false}
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
                <DownloadButton
                  onClick={async () => {
                    await writeExcel();
                  }}
                >
                  다운로드
                </DownloadButton>
              </div>
            </>
          ) : (
            <EmptySettlementBox>
              주문건 존재하지 않습니다.
            </EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorOrderStr}</EmptySettlementBox>
        )}
      </PageLayout>
    </>
  );
}
