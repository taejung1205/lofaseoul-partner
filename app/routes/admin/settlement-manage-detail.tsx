import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { Link, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  dateToKoreanMonth,
  MonthSelectPopover,
  dateToNumeralMonth,
  numeralMonthToKorean,
  koreanMonthToNumeral,
  koreanMonthToDate,
} from "~/components/date";
import { PossibleSellers, SellerSelect } from "~/components/seller";
import {
  isSettlementItemValid,
  setSellerIfLofa,
  setSettlementPartnerName,
  SettlementItem,
  SettlementTable,
} from "~/components/settlement_table";
import {
  getAllSellerSettlementSum,
  SettlementSumBar,
} from "~/components/settlement_sum";
import {
  addSettlements,
  deleteSettlements,
  getPartnerProfile,
  getPartnerProfiles,
  getSettlements,
  getSettlementSum,
} from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";

const GetListButton = styled.button`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  height: 40px;
  line-height: 1;
  margin-left: 20px;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
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

const EditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 250px;
  margin: 4px;
`;

const LongEditInputBox = styled.input`
  font-size: 20px;
  font-weight: 700;
  width: 608px;
  margin: 4px;
`;

const EditDeleteButton = styled.button`
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
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "delete") {
    const settlement = body.get("settlement")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    if (
      settlement !== undefined &&
      month !== undefined &&
      partnerName !== undefined
    ) {
      const jsonArr: SettlementItem[] = JSON.parse(settlement);
      await deleteSettlements({
        settlements: jsonArr,
        monthStr: month,
        partnerName: partnerName,
      });
      const numeralMonth = koreanMonthToNumeral(month);
      return redirect(
        encodeURI(
          `/admin/settlement-manage-detail?partner=${partnerName}&month=${numeralMonth}`
        )
      );
    }
  } else if (actionType === "edit") {
    const deletingItem = body.get("deleting-item")?.toString();
    const newItem = body.get("new-item")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    if (
      deletingItem !== undefined &&
      newItem !== undefined &&
      month !== undefined &&
      partnerName !== undefined
    ) {
      const jsonDelete: SettlementItem = JSON.parse(deletingItem);
      const jsonNew: SettlementItem = JSON.parse(newItem);
      await deleteSettlements({
        settlements: [jsonDelete],
        monthStr: month,
        partnerName: partnerName,
      });
      await addSettlements({
        settlements: [jsonNew],
        monthStr: month,
      });
      const numeralMonth = koreanMonthToNumeral(month);
      return redirect(
        encodeURI(
          `/admin/settlement-manage-detail?partner=${partnerName}&month=${numeralMonth}`
        )
      );
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");
  const partnersMap = await getPartnerProfiles();
  const partnersArr = Array.from(partnersMap.keys());
  if (month !== null && partnerName !== null) {
    const monthStr = numeralMonthToKorean(month);
    const checkPartner = await getPartnerProfile({ name: partnerName });
    if (checkPartner == null) {
      return json({ error: "partner", partnerName: partnerName });
    }
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
      partnerNamesList: partnersArr,
    });
  } else if (month !== null) {
    return json({ error: "partner null" });
  } else {
    return json({ error: "month null", partnerName: partnerName });
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>(); // 선택중인 날짜 (현재 조회된 월이 아닌, MonthSelectPopover로 선택중인 날짜)
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(); //선택중인 날짜의 string (XX년 XX월)
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [items, setItems] = useState<SettlementItem[]>([]); //로딩된 전체 정산내역 아이템 리스트
  const [selectedItems, setSelectedItems] = useState<SettlementItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [seller, setSeller] = useState<string>("all"); //판매처
  const [partnerName, setPartnerName] = useState<string>(); //파트너명 (조회된 파트너명으로 시작, 입력창으로 수정 및 조회)
  const [errorModalStr, setErrorModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [editErrorStr, setEditErrorStr] = useState<string>(""); //수정 모달에서 뜨는 에러 메세지

  //정산내역 수정시 입력창 내용물
  const [sellerEdit, setSellerEdit] = useState<string>("");
  const [orderNumberEdit, setOrderNumberEdit] = useState<string>("");
  const [productNameEdit, setProductNameEdit] = useState<string>("");
  const [priceEdit, setPriceEdit] = useState<number>(0);
  const [amountEdit, setAmountEdit] = useState<number>(0);
  const [feeEdit, setFeeEdit] = useState<number>(0);
  const [shippingFeeEdit, setShippingFeeEdit] = useState<number>(0);
  const [optionNameEdit, setOptionNameEdit] = useState<string>("");
  const [ordererEdit, setOrdererEdit] = useState<string>("");
  const [receiverEdit, setReceiverEdit] = useState<string>("");

  // 모달 열림 여부
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isErrorModalOpened, setIsErrorModalOpened] = useState<boolean>(false);
  const [isEditModalOpened, setIsEditModalOpened] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);

  const loaderData = useLoaderData();
  const submit = useSubmit();

  //선택중인 날짜를 주소로 넣기 위한 숫자 변환
  //TODO: 불필요하므로 이 과정 없애야
  const monthNumeral = useMemo(
    () => dateToNumeralMonth(selectedDate ?? new Date()),
    [selectedDate]
  );

  //loaderData에서 불러온 정산내역 (판매처에 관계없이 전부 불러옴)
  const settlements: SettlementItem[] | null = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.settlements;
    }
  }, [loaderData]);

  //loaderData에서 불러온 정산합
  const sums = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  //loaderData에서 불러온, 현재 조회한 월의 string(XX년 XX월)
  const monthStr: string = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.monthStr;
    }
  }, [loaderData]);

  //loaderData에서 불러온 에러 정보를 바탕으로 한 에러 메세지
  const errorSettlementStr = useMemo(() => {
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
      case "partner null":
        return `파트너 정보가 잘못되었습니다. 다시 조회해주세요. `;
      case "partner null":
        return `날짜 정보가 잘못되었습니다. 다시 조회해주세요. `;
    }
  }, [loaderData]);

  //sums의 모든 판매처의 정산합 (settlement, shipping)
  const allSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      return getAllSellerSettlementSum(sums);
    }
  }, [sums]);

  useEffect(() => {
    if (monthStr !== null) {
      setSelectedDate(koreanMonthToDate(monthStr));
    } else {
      setSelectedDate(new Date());
    }
  }, []);

  useEffect(() => {
    if (settlements !== null) {
      let newItems: SettlementItem[] = [];
      if (seller == "all") {
        newItems = settlements;
      } else if (seller == "etc") {
        newItems = settlements.filter(
          (item) => !PossibleSellers.includes(item.seller)
        );
      } else {
        newItems = settlements.filter((item) => item.seller == seller);
      }
      setItems(newItems);
      const newChecked = Array(newItems.length).fill(false);
      setItemsChecked(newChecked);
    }
  }, [loaderData, seller]);

  useEffect(() => {
    if (selectedDate !== undefined) {
      setSelectedMonthStr(dateToKoreanMonth(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (
      loaderData.partnerName !== undefined &&
      loaderData.partnerName !== "undefined"
    ) {
      setPartnerName(loaderData.partnerName);
    } else {
      setPartnerName("");
    }
  }, [loaderData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(items.length ?? 0).fill(isChecked));
  }

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

  //정산건 삭제를 post합니다.
  function submitDelete(settlementList: SettlementItem[]) {
    const json = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", json);
    formData.set("month", monthStr);
    formData.set("partner", loaderData.partnerName);
    formData.set("action", "delete");
    submit(formData, { method: "post" });
  }

  //수정 시작시 기본 입력값을 선택한 정산건으로 맞춥니다.
  function updateEditItems(settlement: SettlementItem) {
    setSellerEdit(settlement.seller);
    setOrderNumberEdit(settlement.orderNumber);
    setProductNameEdit(settlement.productName);
    setOptionNameEdit(settlement.optionName);
    setPriceEdit(settlement.price);
    setAmountEdit(settlement.amount);
    setFeeEdit(settlement.fee);
    setShippingFeeEdit(settlement.shippingFee);
    setOrdererEdit(settlement.orderer);
    setReceiverEdit(settlement.receiver);
  }

  //수정 입력창에 입력된 정산건 내역을 검증합니다.
  // 잘못됐을 경우 null을 return해 submit이 일어나지 않게 만듭니다.
  // 정상적일 경우 해당 SettlementItem을 return합니다.
  function checkEdit() {
    const newSettlement: SettlementItem = {
      seller: sellerEdit,
      orderNumber: orderNumberEdit,
      productName: productNameEdit,
      optionName: optionNameEdit,
      price: priceEdit,
      amount: amountEdit,
      orderer: ordererEdit,
      receiver: receiverEdit,
      fee: feeEdit,
      shippingFee: shippingFeeEdit,
      partnerName: "",
    };

    const isValid = isSettlementItemValid(newSettlement);
    if (!isValid) {
      setEditErrorStr("잘못된 정산내역입니다. 수정내역을 확인해주세요.");
      return null;
    }

    setSellerIfLofa(newSettlement);

    const nameResult = setSettlementPartnerName(newSettlement);
    if (!nameResult || newSettlement.partnerName.length == 0) {
      setEditErrorStr(
        "잘못된 정산내역입니다. 상품명에 파트너 이름이 들어있는지 확인해주세요."
      );
      return null;
    }

    const isPartnerValid = loaderData.partnerNamesList.includes(
      newSettlement.partnerName
    );
    if (!isPartnerValid) {
      setEditErrorStr(
        `잘못된 정산내역입니다.\n상품명의 파트너가 계약 업체 목록에 있는지 확인해주세요. (${newSettlement.partnerName})`
      );
      return null;
    }

    return newSettlement;
  }

  //정산건 수정을 post합니다.
  //기존 정산건을 삭제하고 수정된 정산건을 추가하는 방식으로 진행됩니다.
  function submitEdit(
    deletingSettlement: SettlementItem,
    newSettlement: SettlementItem
  ) {
    const jsonDelete = JSON.stringify(deletingSettlement);
    const jsonNew = JSON.stringify(newSettlement);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("deleting-item", jsonDelete);
    formData.set("new-item", jsonNew);
    formData.set("month", monthStr);
    formData.set("partner", loaderData.partnerName);
    formData.set("action", "edit");
    submit(formData, { method: "post" });
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

      {/* 정산내역 삭제 모달 */}
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
          {`선택된 정산내역 ${selectedItems.length}건을 삭제하시겠습니까?`}
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

      {/* 정산내역 수정 모달 */}
      <BasicModal
        opened={isEditModalOpened}
        onClose={() => {
          setIsEditModalOpened(false);
          setEditErrorStr("");
        }}
        size="xl"
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
            fontSize: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>판매처</div>
            <EditInputBox
              type="text"
              name="seller"
              value={sellerEdit}
              onChange={(e) => setSellerEdit(e.target.value)}
              required
            />
            <div style={{ width: "100px" }}>주문번호</div>
            <EditInputBox
              type="text"
              name="orderNumber"
              value={orderNumberEdit}
              onChange={(e) => setOrderNumberEdit(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>상품명</div>
            <LongEditInputBox
              type="text"
              name="productName"
              value={productNameEdit}
              onChange={(e) => setProductNameEdit(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>옵션명</div>
            <LongEditInputBox
              type="text"
              name="optionName"
              value={optionNameEdit}
              onChange={(e) => setOptionNameEdit(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>판매단가</div>
            <EditInputBox
              type="number"
              name="price"
              value={priceEdit}
              onChange={(e) => setPriceEdit(Number(e.target.value))}
              required
            />
            <div style={{ width: "100px" }}>수량</div>
            <EditInputBox
              type="number"
              name="amount"
              value={amountEdit}
              onChange={(e) => setAmountEdit(Number(e.target.value))}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>주문자</div>
            <EditInputBox
              type="text"
              name="orderer"
              value={ordererEdit}
              onChange={(e) => setOrdererEdit(e.target.value)}
              required
            />
            <div style={{ width: "100px" }}>수령자</div>
            <EditInputBox
              type="text"
              name="receiver"
              value={receiverEdit}
              onChange={(e) => setReceiverEdit(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>수수료</div>
            <EditInputBox
              type="number"
              name="fee"
              value={feeEdit}
              onChange={(e) => setFeeEdit(Number(e.target.value))}
              required
            />
            <div style={{ width: "100px" }}>배송비</div>
            <EditInputBox
              type="number"
              name="shippingFee"
              value={shippingFeeEdit}
              onChange={(e) => setShippingFeeEdit(Number(e.target.value))}
              required
            />
          </div>
          <div style={{ height: "20px" }} />
          {editErrorStr}
          {editErrorStr.length > 0 ? <div style={{ height: "20px" }} /> : <></>}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsEditModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              type="submit"
              onClick={async () => {
                const checkResult = checkEdit();
                if (checkResult !== null) {
                  submitEdit(selectedItems[0], checkResult);
                  setIsEditModalOpened(false);
                }
              }}
            >
              수정
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
            <SellerInputBox
              type="text"
              name="name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Link
              to={`/admin/settlement-manage-detail?month=${monthNumeral}&partner=${partnerName}`}
            >
              <GetListButton>조회하기</GetListButton>
            </Link>
          </div>

          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.error == undefined ? (
          items.length > 0 ? (
            <SettlementTable
              items={items}
              itemsChecked={itemsChecked}
              onItemCheck={onItemCheck}
              onCheckAll={onCheckAll}
              defaultAllCheck={false}
            />
          ) : (
            <EmptySettlementBox>
              정산내역이 존재하지 않습니다.
            </EmptySettlementBox>
          )
        ) : (
          <EmptySettlementBox>{errorSettlementStr}</EmptySettlementBox>
        )}
        {sums !== null && allSum !== null ? (
          <>
            <div style={{ height: "20px" }} />
            <div style={{ display: "flex" }}>
              <EditDeleteButton
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
                선택 정산건 삭제
              </EditDeleteButton>
              <EditDeleteButton
                onClick={() => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length == 1) {
                    updateEditItems(updatedList[0]);
                    setIsEditModalOpened(true);
                  } else if (updatedList.length == 0) {
                    setErrorModalStr("선택된 정산내역이 없습니다.");
                    setIsErrorModalOpened(true);
                  } else {
                    setErrorModalStr("정산내역 수정은 1개씩만 가능합니다.");
                    setIsErrorModalOpened(true);
                  }
                }}
              >
                선택 정산건 수정
              </EditDeleteButton>
            </div>
            <div style={{ height: "40px" }} />
            <SettlementSumBar
              seller={seller ?? "all"}
              settlement={
                seller == "all"
                  ? allSum.settlement
                  : sums[`settlement_${seller}`]
              }
              shippingFee={
                seller == "all"
                  ? allSum.shippingFee
                  : sums[`shipping_${seller}`]
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
