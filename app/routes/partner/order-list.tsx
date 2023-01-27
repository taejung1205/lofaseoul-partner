import { PageLayout } from "~/components/page_layout";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useSubmit } from "@remix-run/react";
import {
  dateToDayStr,
  DaySelectPopover,
  dayStrToDate,
} from "~/components/date";
import { GetListButton } from "~/components/button";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { OrderItem, OrderTable } from "~/components/order";
import styled from "styled-components";
import { getPartnerOrders } from "~/services/firebase.server";
import authenticator from "~/services/auth.server";
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

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const action: ActionFunction = async ({ request }) => {
  //   const body = await request.formData();
  //   const actionType = body.get("action")?.toString();
  //   if (actionType === "delete") {
  //     const orders = body.get("order")?.toString();
  //     const day = body.get("day")?.toString();
  //     if (orders !== undefined && day !== undefined) {
  //       const jsonArr: OrderItem[] = JSON.parse(orders);
  //       await deleteOrders({
  //         orders: jsonArr,
  //         dayStr: day,
  //       });
  //       return redirect(encodeURI(`/admin/order-list?day=${day}`));
  //     }
  //   }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  let partnerName: string;
  let user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (user !== null && "name" in user) {
    partnerName = user.name;
  } else {
    return null;
  }
  const url = new URL(request.url);
  const day = url.searchParams.get("day");
  console.log(day);

  if (day !== null) {
    const orders = await getPartnerOrders({
      dayStr: day,
      partnerName: partnerName,
    });
    return json({ day: day, orders: orders });
  } else {
    const today = dateToDayStr(new Date());
    const orders = await getPartnerOrders({
      dayStr: today,
      partnerName: partnerName,
    });
    return json({ day: today, orders: orders });
  }
};

export default function AdminOrderList() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 정산내역 아이템 리스트

  const submit = useSubmit();
  const loaderData = useLoaderData();
  const formRef = useRef<HTMLFormElement>(null);

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
      setSelectedDate(new Date());
    } else {
      setSelectedDate(dayStrToDate(loaderData.day));
    }
  }, []);

  useEffect(() => {
    if (loaderData.error == undefined) {
      setItems(loaderData.orders);
    }
  }, [loaderData]);

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
        column: "배송사코드",
        type: String,
        value: (item: OrderItem) => item.shippingCompanyNumber,
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
      fileName: `주문서_${loaderData.day}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  return (
    <>
      <PageLayout>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <DaySelectPopover
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          <Link to={`/partner/order-list?day=${selectedDayStr}`}>
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
                onItemCheck={() => {}}
                onCheckAll={() => {}}
                defaultAllCheck={false}
                checkboxRequired={false}
              />
              <div style={{ height: "20px" }} />
              <DownloadButton
                onClick={async () => {
                  await writeExcel();
                }}
              >
                주문서 다운로드
              </DownloadButton>
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
