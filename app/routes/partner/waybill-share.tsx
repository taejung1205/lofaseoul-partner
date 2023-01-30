import { PageLayout } from "~/components/page_layout";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useActionData,
  useLoaderData,
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
import {
  isOrderItemValid,
  OrderItem,
  OrderTable,
  setOrderPartnerName,
  adjustSellerName,
} from "~/components/order";
import styled from "styled-components";
import { getPartnerOrders, addWaybills } from "~/services/firebase.server";
import writeXlsxFile from "write-excel-file";
import * as xlsx from "xlsx";
import { BasicModal, ModalButton } from "~/components/modal";
import { PossibleShippingCompanies } from "~/components/shipping_company";
import { requireUser } from "~/services/session.server";

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

const EmptySettlementBox = styled.div`
  display: flex;
  text-align: center;
  font-size: 24px;
  height: 100px;
  align-items: center;
  justify-content: center;
  width: inherit;
`;

const BottomButton = styled.button`
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
    const orders = body.get("order")?.toString();
    const day = body.get("day")?.toString();
    if (orders !== undefined && day !== undefined) {
      const jsonArr: OrderItem[] = JSON.parse(orders);
      await addWaybills({
        orders: jsonArr,
        dayStr: day,
      });
      return json({ message: `운송장이 공유되었습니다.` });
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
    return redirect("/login");
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("day");

  if (day !== null) {
    const orders = await getPartnerOrders({
      dayStr: day,
      partnerName: partnerName,
    });
    return json({ day: day, orders: orders, name: partnerName });
  } else {
    const today = dateToDayStr(new Date());
    const orders = await getPartnerOrders({
      dayStr: today,
      partnerName: partnerName,
    });
    return json({ day: today, orders: orders, name: partnerName });
  }
};

export default function AdminOrderList() {
  const [fileName, setFileName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 주문건 index 배열
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [items, setItems] = useState<OrderItem[]>([]); //로딩된 전체 주문건 아이템 리스트

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");

  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isShareModalOpened, setIsShareModalOpened] = useState<boolean>(false);

  const actionData = useActionData();
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

  function shareWaybill(orderList: OrderItem[], dayStr: string) {
    const json = JSON.stringify(orderList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("order", json);
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

  const readExcel = (e: any) => {
    e.preventDefault();
    let json: any;
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const array: OrderItem[] = [];
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = xlsx.utils.sheet_to_json(worksheet);

        let warningMessage = "";

        for (let i = 0; i < json.length; i++) {
          let element = json[i];
          let item: OrderItem = {
            seller: element.판매처,
            orderNumber: element.주문번호,
            productName: element.상품명,
            optionName: element.옵션명 ?? "",
            amount: Number(element.배송수량),
            orderer: element.주문자명,
            receiver: element.수취인,
            partnerName: "",
            zipCode: element.우편번호,
            address: element.주소,
            phone: element.연락처,
            ordererPhone: element["주문자 전화번호"] ?? "",
            customsCode: element.통관부호 ?? "",
            deliveryRequest: element.배송요청사항 ?? "",
            managementNumber: element.관리번호?.toString(),
            shippingCompany: element.배송사코드 ?? "",
            waybillNumber: element.송장번호 ?? "",
            waybillSharedDate: "",
            orderSharedDate: "",
          };

          let isValid = isOrderItemValid(item);
          if (!isValid) {
            console.log(item);
            setNoticeModalStr("유효하지 않은 엑셀 파일입니다.");
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          adjustSellerName(item);

          let nameResult = setOrderPartnerName(item);

          if (!nameResult || item.partnerName.length == 0) {
            console.log(item);
            setNoticeModalStr(
              "유효하지 않은 엑셀 파일입니다.\n상품명에 파트너 이름이 들어있는지 확인해주세요."
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          if (item.partnerName !== loaderData.name) {
            console.log(item);
            setNoticeModalStr(
              `유효하지 않은 엑셀 파일입니다.\n상품명에 기록된 파트너명을 확인해주세요. (${item.partnerName})`
            );
            setIsNoticeModalOpened(true);
            setFileName("");
            setItems([]);
            return false;
          }

          if (!PossibleShippingCompanies.includes(item.shippingCompany)) {
            warningMessage =
              "택배사 이름이 잘못 입력된 운송장이 있습니다. 확인 및 수정 후 공유해주세요.";
            item.shippingCompany = "";
          }

          array.push(item);
        }
        if (warningMessage.length > 0) {
          setNoticeModalStr(warningMessage);
          setIsNoticeModalOpened(true);
        }
        console.log(array);
        setItems(array);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

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
      fileName: `주문서_${loaderData.day}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

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
          {`선택된 운송장 ${selectedItems.length}건을 공유하시겠습니까?`}
          <br />
          {`운송장을 공유할 주문서 일자: ${loaderData.day}`}
          <br />
          {
            "(해당 날짜에 공유된 주문건이 아닐 경우 운송장 공유가 정상적으로 이루어지지 않습니다.)"
          }
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
          <Link to={`/partner/waybill-share?day=${selectedDayStr}`}>
            <GetListButton>조회하기</GetListButton>
          </Link>
        </div>
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
              <div style={{ display: "flex" }}>
                <BottomButton
                  onClick={async () => {
                    await writeExcel();
                  }}
                >
                  주문서 다운로드
                </BottomButton>
                <BottomButton
                  onClick={() => {
                    const updatedList = updateCheckedItems();
                    if (updatedList == null) {
                      setNoticeModalStr(
                        "선택한 항목의 택배사, 송장번호를 확인해주세요."
                      );
                      setIsNoticeModalOpened(true);
                    } else {
                      if (updatedList.length == 0) {
                        setNoticeModalStr("선택된 운송장이 없습니다.");
                        setIsNoticeModalOpened(true);
                      } else {
                        setIsShareModalOpened(true);
                      }
                    }
                  }}
                >
                  운송장 공유
                </BottomButton>
              </div>
            </>
          ) : (
            <EmptySettlementBox>
              주문건이 존재하지 않습니다.
            </EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorOrderStr}</EmptySettlementBox>
        )}
      </PageLayout>
    </>
  );
}
