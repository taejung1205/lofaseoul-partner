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
  monthToKorean,
  MonthSelectPopover,
  monthToNumeral,
  numeralMonthToKorean,
  koreanMonthToNumeral,
  koreanMonthToDate,
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
import {
  deleteSettlements,
  getPartnerProfile,
  getSettlements,
  getSettlementSum,
} from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";

const SettlementListPage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 30px 40px 30px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

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

const InputBox = styled.input`
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
        encodeURI(`/admin/settlement-manage-detail?partner=${partnerName}&month=${numeralMonth}`)
      );
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");
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
    });
  } else if (month !== null) {
    return json({ error: "partner null" });
  } else {
    return json({ error: "month null", partnerName: partnerName });
  }
};

export default function AdminSettlementShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>();
  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]);
  const [items, setItems] = useState<SettlementItem[]>([]); //로딩된 전체 정산내역 아이템 리스트
  const [selectedItems, setSelectedItems] = useState<SettlementItem[]>([]); // 체크박스로 선택된 아이템 목록. 삭제, 수정 버튼 눌렀을 때 업데이트됨
  const [seller, setSeller] = useState<string>("all");
  const [partnerName, setPartnerName] = useState<string>();
  const [errorModalStr, setErrorModalStr] = useState<string>("");

  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);

  const [isErrorModalOpened, setIsErrorModalOpened] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);

  const loaderData = useLoaderData();
  const submit = useSubmit();

  const monthNumeral = useMemo(
    () => monthToNumeral(selectedDate ?? new Date()),
    [selectedDate]
  );

  const settlements: SettlementItem[] | null = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.settlements;
    }
  }, [loaderData]);

  const sums = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.sums;
    }
  }, [loaderData]);

  const monthStr: string = useMemo(() => {
    if (loaderData.error !== undefined) {
      return null;
    } else {
      return loaderData.monthStr;
    }
  }, [loaderData]);

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

  const allSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      return getAllSellerSettlementSum(sums);
    }
  }, [sums]);

  useEffect(() => {
    if(monthStr !== null){
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
      setSelectedMonthStr(monthToKorean(selectedDate));
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

  function updateCheckedItems() {
    let settlementList = [];
    for (let i = 0; i < items.length; i++) {
      if (itemsChecked[i]) {
        settlementList.push(items[i]);
      }
    }
    setSelectedItems(settlementList);
    return settlementList.length;
  }

  function deleteSettlements(settlementList: SettlementItem[]) {
    const json = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", json);
    formData.set("month", monthStr);
    formData.set("partner", loaderData.partnerName);
    formData.set("action", "delete");
    onCheckAll(false);
    submit(formData, { method: "post" });
  }

  return (
    <>
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
                deleteSettlements(selectedItems);
                setIsDeleteModalOpened(false);
              }}
            >
              삭제
            </ModalButton>
          </div>
        </div>
      </BasicModal>
      <SettlementListPage>
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
            <InputBox
              type="text"
              name="name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Link
              to={`/admin/settlement-manage-detail?month=${monthNumeral}&partner=${partnerName}`}
            >
              <GetListButton type="submit">조회하기</GetListButton>
            </Link>
          </div>

          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <div style={{ height: "20px" }} />
        {loaderData.error == undefined ? (
          items.length > 0 ? (
            <SettlementTableMemo
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
                  const updatedListLength = updateCheckedItems();
                  if (updatedListLength > 0) {
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
                const updatedListLength = updateCheckedItems();
                if (updatedListLength == 1) {
                  setIsDeleteModalOpened(true);
                } else if (updatedListLength == 0){
                  setErrorModalStr("선택된 정산내역이 없습니다.");
                  setIsErrorModalOpened(true);
                } else {
                  setErrorModalStr("정산내역 수정은 1개씩만 가능합니다.");
                  setIsErrorModalOpened(true);
                }
              }}>선택 정산건 수정</EditDeleteButton>
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
      </SettlementListPage>
    </>
  );
}
