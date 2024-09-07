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
import { MonthSelectPopover } from "~/components/date";
import {
  adjustSellerName,
  PossibleSellers,
  SellerSelect,
} from "~/components/seller";
import {
  isSettlementItemValid,
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
  getAllPartnerProfiles,
  getSettlements,
  getSettlementSum,
  deleteSettlementsShippingFee,
} from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { PageLayout } from "~/components/page_layout";
import { CommonButton } from "~/components/button";
import { Checkbox, LoadingOverlay, Space } from "@mantine/core";
import writeXlsxFile from "write-excel-file";
import {
  dateToDayStr,
  dateToKoreanMonth,
  dateToNumeralMonth,
  dayStrToDate,
  getTimezoneDate,
  koreanMonthToDate,
  numeralMonthToKorean,
} from "~/utils/date";
import { PartnerProfile } from "~/components/partner_profile";
import { requireUser } from "~/services/session.server";

interface EmptySettlementBoxProps extends React.HTMLProps<HTMLDivElement> {}

const EmptySettlementBox: React.FC<EmptySettlementBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    display: "flex",
    textAlign: "center",
    fontSize: "24px",
    height: "100px",
    alignItems: "center",
    justifyContent: "center",
    width: "inherit",
  };

  return <div style={styles} {...props} />;
};

interface PartnerNameInputBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PartnerNameInputBox: React.FC<PartnerNameInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    width: "200px",
    height: "40px",
    border: "3px solid black",
    padding: "6px",
    textAlign: "left",
    fontSize: "20px",
    fontWeight: 700,
    marginLeft: "20px",
  };

  return <input style={styles} {...props} />;
};

interface EditInputBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const EditInputBox: React.FC<EditInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "250px",
    margin: "4px",
  };

  return <input style={styles} {...props} />;
};

interface LongEditInputBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const LongEditInputBox: React.FC<LongEditInputBoxProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: "608px",
    margin: "4px",
  };

  return <input style={styles} {...props} />;
};

interface InfoTextProps extends React.HTMLProps<HTMLDivElement> {}

const InfoText: React.FC<InfoTextProps> = (props) => {
  const styles: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: "1",
    padding: "6px",
  };

  return <div style={styles} {...props} />;
};

interface Button1Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button1: React.FC<Button1Props> = (props) => {
  const styles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "24px",
    fontWeight: 700,
    width: "240px",
    height: "50px",
    lineHeight: "1",
    padding: "6px",
    marginRight: "40px",
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
};

interface Button2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button2: React.FC<Button2Props> = (props) => {
  const styles: React.CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: "20px",
    fontWeight: 700,
    width: "240px",
    height: "50px",
    lineHeight: "1",
    padding: "6px",
    marginRight: "40px",
    cursor: "pointer",
  };

  return <button style={styles} {...props} />;
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "delete") {
    const settlement = body.get("settlement")?.toString();
    const month = body.get("month")?.toString();
    if (settlement !== undefined && month !== undefined) {
      const result = await deleteSettlements({
        settlements: settlement,
        monthStr: month,
      });
      if (result == true) {
        return json({
          message: `삭제가 등록되었습니다. 잠시 후 새로고침하여 확인해주세요.`,
        });
      } else {
        throw Error(result);
      }
    }
  } else if (actionType === "edit") {
    const deletingItem = body.get("deleting-item")?.toString();
    const newItem = body.get("new-item")?.toString();
    const month = body.get("month")?.toString();
    if (
      deletingItem !== undefined &&
      newItem !== undefined &&
      month !== undefined
    ) {
      const result_1 = await deleteSettlements({
        settlements: `[${deletingItem}]`,
        monthStr: month,
      });

      if (result_1 !== true) {
        throw Error(result_1);
      }

      const result_2 = await addSettlements({
        settlements: `[${newItem}]`,
        monthStr: month,
      });

      if (result_2 == true) {
        return json({
          message: `수정이 등록되었습니다. 잠시 후 새로고침하여 확인해주세요.`,
        });
      } else {
        throw Error(result_2);
      }
    }
  } else if (actionType == "shipping-delete") {
    const settlement = body.get("settlement")?.toString();
    const month = body.get("month")?.toString();
    if (settlement !== undefined && month !== undefined) {
      const result = await deleteSettlementsShippingFee({
        settlements: settlement,
        monthStr: month,
      });
      if (result == true) {
        return json({
          message: `배송비 삭제가 등록되었습니다. 잠시 후 새로고침하여 확인해주세요.`,
        });
      } else {
        throw Error(result);
      }
    }
  } else if (actionType == "add") {
    const newItem = body.get("new-item")?.toString();
    const month = body.get("month")?.toString();
    const partnerName = body.get("partner")?.toString();
    if (
      newItem !== undefined &&
      month !== undefined &&
      partnerName !== undefined
    ) {
      const result = await addSettlements({
        settlements: `[${newItem}]`,
        monthStr: month,
      });

      if (result == true) {
        return json({
          message: `추가가 등록되었습니다. 잠시 후 새로고침하여 확인해주세요.`,
        });
      } else {
        throw Error(result);
      }
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  //스태프는 접근 불가
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/logout");
  }

  if (user.isStaff) {
    return redirect("/admin/dashboard");
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const partnerName = url.searchParams.get("partner");
  const partnersMap = await getAllPartnerProfiles();
  const partnersArr = Array.from(partnersMap.values());
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
      partners: partnersArr,
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
  const [partnerName, setPartnerName] = useState<string>(""); //파트너명 (조회된 파트너명으로 시작, 입력창으로 수정 및 조회)
  const [noticeModalStr, setNoticeModalStr] = useState<string>(""); //안내 모달창에서 뜨는 메세지
  const [editErrorStr, setEditErrorStr] = useState<string>(""); //수정 모달에서 뜨는 에러 메세지

  //정산내역 수정시 입력창 내용물
  const [sellerEdit, setSellerEdit] = useState<string>("");
  const [orderNumberEdit, setOrderNumberEdit] = useState<string>("");
  const [productNameEdit, setProductNameEdit] = useState<string>("");
  const [priceEdit, setPriceEdit] = useState<number>(0);
  const [amountEdit, setAmountEdit] = useState<number>(0);
  const [feeEdit, setFeeEdit] = useState<number>(0);
  const [shippingFeeEdit, setShippingFeeEdit] = useState<number>(0);
  const [orderTagEdit, setOrderTagEdit] = useState<string>("");
  const [optionNameEdit, setOptionNameEdit] = useState<string>("");
  const [ordererEdit, setOrdererEdit] = useState<string>("");
  const [receiverEdit, setReceiverEdit] = useState<string>("");
  const [orderDateEdit, setOrderDateEdit] = useState<string>("");
  const [providerNameEdit, setProviderNameEdit] = useState<string>("");

  const [isSeperatingShippingFee, setIsSeparatingShippingFee] =
    useState<boolean>(false);

  const [isManuallyFixingDiscount, setIsManuallyFixingDiscount] =
    useState<boolean>(false);
  const [discountedPriceEdit, setDiscountedPriceEdit] = useState<number>(0);
  const [partnerDiscountLevyEdit, setPartnerDiscountLevyEdit] =
    useState<number>(0);
  const [lofaAdjustmentFeeEdit, setLofaAdjustmentFeeEdit] = useState<number>(0);

  // 모달 열림 여부
  const [isDeleteShippingFeeModalOpened, setIsDeleteShippingFeeModalOpened] =
    useState<boolean>(false);
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isEditModalOpened, setIsEditModalOpened] = useState<boolean>(false);

  // EditModal 열린게 수정용인지 여부
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const actionData = useActionData();
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
      return loaderData.settlements.map((val: any) => {
        if (val.orderDate) {
          val.orderDate = new Date(val.orderDate);
        }
        return val;
      });
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
      case "month null":
        return `날짜 정보가 잘못되었습니다. 다시 조회해주세요. `;
    }

    return "알 수 없는 오류입니다.";
  }, [loaderData]);

  //sums의 모든 판매처의 정산합 (settlement, shipping)
  const allSum = useMemo(() => {
    if (sums == null) {
      return null;
    } else {
      return getAllSellerSettlementSum(sums);
    }
  }, [sums]);

  const partnerProfilesFromName = useMemo(() => {
    let map = new Map();
    if (loaderData.partners) {
      loaderData.partners.forEach((partner: PartnerProfile) => {
        map.set(partner.name, partner);
      });
      return map;
    } else {
      return undefined;
    }
  }, [loaderData]);

  const partnerProfilesFromProviderName = useMemo(() => {
    let map = new Map();
    if (loaderData.partners) {
      loaderData.partners.forEach((partner: PartnerProfile) => {
        map.set(partner.providerName, partner);
      });
      return map;
    } else {
      return undefined;
    }
  }, [loaderData]);

  const isDiscounted = useMemo(() => {
    return (
      priceEdit != discountedPriceEdit ||
      partnerDiscountLevyEdit != 0 ||
      lofaAdjustmentFeeEdit != 0
    );
  }, [
    priceEdit,
    discountedPriceEdit,
    partnerDiscountLevyEdit,
    lofaAdjustmentFeeEdit,
  ]);

  useEffect(() => {
    if (monthStr !== null) {
      setSelectedDate(koreanMonthToDate(monthStr));
    } else {
      setSelectedDate(getTimezoneDate(new Date()));
    }
  }, []);

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      setNoticeModalStr(actionData.message ?? actionData);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

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
    console.log(loaderData);
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
  function submitDeleteSettlements(settlementList: SettlementItem[]) {
    console.log("submit delete settlement, length:", settlementList.length);
    const data = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", data);
    formData.set("month", selectedMonthStr!);
    formData.set("action", "delete");
    submit(formData, { method: "post" });
  }

  //정산건 배송비 제거를 post합니다.
  function submitShippingFeeDelete(settlementList: SettlementItem[]) {
    console.log("submit delete shipping fee, length:", settlementList.length);
    const data = JSON.stringify(settlementList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("settlement", data);
    formData.set("month", selectedMonthStr!);
    formData.set("action", "shipping-delete");
    submit(formData, { method: "post" });
  }

  //수정 시작시 기본 입력값을 선택한 정산건으로 맞춥니다.
  //파라미터로 null이 들어오면 정산건을 추가하는 요청으로 해석, 수수료 제외 전부 0 또는 공백으로 맞춥니다.
  function updateEditItems(settlement: SettlementItem | null) {
    console.log(
      partnerProfilesFromName
        ? partnerProfilesFromName.get(loaderData.partnerName)
        : "no partner"
    );
    console.log("settlement", settlement?.providerName);
    if (settlement !== null) {
      setSellerEdit(settlement.seller);
      setOrderNumberEdit(settlement.orderNumber);
      setProductNameEdit(settlement.productName);
      setOptionNameEdit(settlement.optionName);
      setPriceEdit(settlement.price);
      setAmountEdit(settlement.amount);
      setFeeEdit(settlement.fee);
      setShippingFeeEdit(settlement.shippingFee);
      setOrderTagEdit(settlement.orderTag);
      setOrdererEdit(settlement.orderer);
      setReceiverEdit(settlement.receiver);
      setOrderDateEdit(
        settlement.orderDate ? dateToDayStr(settlement.orderDate) : ""
      );
      setProviderNameEdit(
        settlement.providerName ?? partnerProfilesFromName
          ? partnerProfilesFromName!.get(loaderData.partnerName).providerName
          : ""
      );
      setIsManuallyFixingDiscount(settlement.isDiscountManuallyFixed ?? false);
      setDiscountedPriceEdit(settlement.discountedPrice ?? settlement.price);
      setPartnerDiscountLevyEdit(settlement.partnerDiscountLevy ?? 0);
      setLofaAdjustmentFeeEdit(settlement.lofaAdjustmentFee ?? 0);
      setIsSeparatingShippingFee(settlement.isSeparatingShippingFee ?? false);
    } else {
      setSellerEdit("");
      setOrderNumberEdit("");
      setProductNameEdit(`[${partnerName}]`);
      setOptionNameEdit("");
      setPriceEdit(0);
      setAmountEdit(0);
      setOrdererEdit("");
      setReceiverEdit("");
      setOrderTagEdit("");
      setOrderDateEdit("");
      setProviderNameEdit(partnerName);
      setIsManuallyFixingDiscount(false);
      setDiscountedPriceEdit(0);
      setPartnerDiscountLevyEdit(0);
      setLofaAdjustmentFeeEdit(0);
      setIsSeparatingShippingFee(false);
    }
  }

  //수정 입력창에 입력된 정산건 내역을 검증합니다.
  // 잘못됐을 경우 null을 return해 submit이 일어나지 않게 만듭니다.
  // 정상적일 경우 해당 SettlementItem을 return합니다.
  function checkEdittedSettlementItem() {
    const newSettlement: SettlementItem = {
      orderDate: dayStrToDate(orderDateEdit),
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
      orderTag: orderTagEdit,
      providerName: providerNameEdit,
      isDiscounted: isDiscounted,
      isSeparatingShippingFee: isSeperatingShippingFee,
    };

    if (isManuallyFixingDiscount || isDiscounted) {
      newSettlement.isDiscountManuallyFixed = true;
      newSettlement.discountedPrice = discountedPriceEdit;
      newSettlement.partnerDiscountLevy = partnerDiscountLevyEdit;
      newSettlement.lofaAdjustmentFee = lofaAdjustmentFeeEdit;
    }

    const checkValid = isSettlementItemValid(newSettlement);
    if (checkValid !== "ok") {
      setEditErrorStr("잘못된 정산내역입니다. " + checkValid);
      return null;
    }

    adjustSellerName(newSettlement);

    // const nameResult = setSettlementPartnerName(newSettlement);
    // if (!nameResult || newSettlement.partnerName.length == 0) {
    //   setEditErrorStr(
    //     "잘못된 정산내역입니다. 상품명에 파트너 이름이 들어있는지 확인해주세요."
    //   );
    //   return null;
    // }

    const isProviderNameValid = partnerProfilesFromProviderName
      ? partnerProfilesFromProviderName.get(providerNameEdit)
      : "";

    if (!isProviderNameValid) {
      setEditErrorStr(
        `잘못된 정산내역입니다.\n해당 공급처명이 계약업체목록에 있는지 확인해주세요. (${providerNameEdit})`
      );
      return null;
    }

    newSettlement.partnerName = partnerProfilesFromProviderName
      ? partnerProfilesFromProviderName.get(providerNameEdit).name
      : "";

    return newSettlement;
  }

  //정산건 수정을 post합니다.
  //기존 정산건을 삭제하고 수정된 정산건을 추가하는 방식으로 진행됩니다.
  function submitEditSettlement(
    deletingSettlement: SettlementItem,
    newSettlement: SettlementItem
  ) {
    const jsonDelete = JSON.stringify(deletingSettlement);
    const jsonNew = JSON.stringify(newSettlement);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("deleting-item", jsonDelete);
    formData.set("new-item", jsonNew);
    formData.set("month", monthStr);
    formData.set("action", "edit");
    submit(formData, { method: "post" });
  }

  //정산건 추가를 post합니다.
  function submitAddSettlement(newSettlement: SettlementItem) {
    const jsonNew = JSON.stringify(newSettlement);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("new-item", jsonNew);
    formData.set("month", monthStr);
    formData.set("partner", loaderData.partnerName);
    formData.set("action", "add");
    submit(formData, { method: "post" });
  }

  async function writeExcel(selected: SettlementItem[]) {
    await writeXlsxFile(selected, {
      schema,
      headerStyle: {
        fontWeight: "bold",
        align: "center",
      },
      fileName: `정산내역_${partnerName}_${loaderData.monthStr}.xlsx`,
      fontFamily: "맑은 고딕",
      fontSize: 10,
    });
  }

  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />

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
                submitDeleteSettlements(selectedItems);
                setIsDeleteModalOpened(false);
              }}
            >
              삭제
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      {/* 정산내역 배송비 제거 모달 */}
      <BasicModal
        opened={isDeleteShippingFeeModalOpened}
        onClose={() => setIsDeleteShippingFeeModalOpened(false)}
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {`선택된 정산내역 ${selectedItems.length}건의 배송비를 삭제하시겠습니까?`}
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton
              onClick={() => setIsDeleteShippingFeeModalOpened(false)}
            >
              취소
            </ModalButton>
            <ModalButton
              onClick={async () => {
                submitShippingFeeDelete(selectedItems);
                setIsDeleteShippingFeeModalOpened(false);
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
      >
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
            fontWeight: "700",
            fontSize: "20px",
          }}
        >
          <div style={{ fontSize: "16px", lineHeight: "30px" }}>
            {"* 수익통계는 정산내역 수정을 반영하지 않음을 유의해주세요."}
          </div>
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
            <div style={{ width: "100px" }}>주문일</div>
            <LongEditInputBox
              type="text"
              name="optionName"
              value={orderDateEdit}
              onChange={(e) => setOrderDateEdit(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>정상판매가</div>
            <EditInputBox
              type="number"
              name="price"
              value={priceEdit}
              onChange={(e) => {
                setPriceEdit(Number(e.target.value));
                if (!isManuallyFixingDiscount && !isDiscounted) {
                  setDiscountedPriceEdit(Number(e.target.value));
                }
              }}
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
            style={{ fontSize: "12px", lineHeight: "25px", textAlign: "left" }}
          >
            {
              "* 정산금 계산에 사용되는 '정상판매가'입니다. 할인이 적용된 판매단가 수정을 원하실 경우, 하단의 할인판매가롤 수정해주세요."
            }
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
            <div style={{ width: "100px" }}>배송비</div>
            <EditInputBox
              type="number"
              name="shippingFee"
              value={shippingFeeEdit}
              onChange={(e) => setShippingFeeEdit(Number(e.target.value))}
              required
            />
            <div style={{ width: "100px" }}>수수료</div>
            <EditInputBox
              type="number"
              name="fee"
              value={feeEdit}
              onChange={(e) => setFeeEdit(Number(e.target.value))}
              required
            />
          </div>
          <Space h={10} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "150px", fontSize: "16px" }}>
              배송비 별도 적용
            </div>
            <Checkbox
              size={"sm"}
              checked={isSeperatingShippingFee}
              onChange={(event) => {
                setIsSeparatingShippingFee(event.currentTarget.checked);
                if (event.currentTarget.checked) {
                  setNoticeModalStr(
                    "배송비 별도 적용을 체크할 경우, 해당 주문건은 주문번호 중복 여부에 관계 없이 배송비가 합산에 적용됩니다."
                  );
                  setIsNoticeModalOpened(true);
                }
              }}
            />
          </div>
          <Space h={10} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px" }}>공급처명</div>
            <EditInputBox
              type="text"
              name="providerName"
              value={providerNameEdit}
              onChange={(e) => setProviderNameEdit(e.target.value)}
              required
            />
            <div style={{ width: "100px" }}>주문태그</div>
            <EditInputBox
              type="text"
              name="orderTag"
              value={orderTagEdit}
              onChange={(e) => setOrderTagEdit(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "40px",
            }}
          >
            <div style={{ width: "100px" }}>할인여부</div>
            <div style={{ width: "250px", padding: "4px", textAlign: "left" }}>
              {isDiscounted ? "O" : "X"}
            </div>
            <div style={{ width: "150px" }}>할인 직접 수정</div>
            <Checkbox
              size={"sm"}
              checked={isManuallyFixingDiscount}
              onChange={(event) => {
                setIsManuallyFixingDiscount(event.currentTarget.checked);
                if (event.currentTarget.checked) {
                  setNoticeModalStr(
                    "할인내역을 직접 수정할 경우, 기존 할인내역과의 동기화가 삭제됩니다."
                  );
                  setIsNoticeModalOpened(true);
                }
              }}
            />
          </div>
          <Space h={20} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px", fontSize: "13px" }}>
              업체부담할인금
            </div>
            <EditInputBox
              type="number"
              name="partnerDiscountLevy"
              value={partnerDiscountLevyEdit}
              onChange={(e) => {
                if (isManuallyFixingDiscount) {
                  setPartnerDiscountLevyEdit(Number(e.target.value));
                } else {
                  setNoticeModalStr(
                    "할인 직접 수정을 체크한 후 수정이 가능합니다."
                  );
                  setIsNoticeModalOpened(true);
                }
              }}
              required
            />
            <div style={{ width: "100px", fontSize: "13px" }}>
              로파조정수수료
            </div>
            <EditInputBox
              type="number"
              name="lofaAdjustmentFee"
              value={lofaAdjustmentFeeEdit}
              onChange={(e) => {
                if (isManuallyFixingDiscount) {
                  setLofaAdjustmentFeeEdit(Number(e.target.value));
                } else {
                  setNoticeModalStr(
                    "할인 직접 수정을 체크한 후 수정이 가능합니다."
                  );
                  setIsNoticeModalOpened(true);
                }
              }}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100px", fontSize: "13px" }}>
              할인적용 판매가
            </div>
            <EditInputBox
              type="number"
              name="discountedPrice"
              value={discountedPriceEdit}
              onChange={(e) => {
                if (isManuallyFixingDiscount) {
                  setDiscountedPriceEdit(Number(e.target.value));
                } else {
                  setNoticeModalStr(
                    "할인 직접 수정을 체크한 후 수정이 가능합니다."
                  );
                  setIsNoticeModalOpened(true);
                }
              }}
              required
            />
            <div style={{ width: "100px" }}>정산금액</div>
            <div>
              {(priceEdit * Math.abs(amountEdit) * (100 - feeEdit)) / 100.0 -
                partnerDiscountLevyEdit +
                lofaAdjustmentFeeEdit}
            </div>
          </div>
          <div style={{ height: "20px" }} />
          {editErrorStr}
          {editErrorStr.length > 0 ? <div style={{ height: "20px" }} /> : <></>}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsEditModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              type={"submit"}
              onClick={async () => {
                const checkResult = checkEdittedSettlementItem();
                if (checkResult !== null) {
                  if (isEdit) {
                    submitEditSettlement(selectedItems[0], checkResult);
                  } else {
                    submitAddSettlement(checkResult);
                  }
                  setIsEditModalOpened(false);
                }
              }}
            >
              {isEdit ? "수정" : "추가"}
            </ModalButton>
          </div>
        </div>
      </BasicModal>

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
            <PartnerNameInputBox
              type="text"
              name="name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
            <Space w={20} />
            <Link
              to={
                partnerName.length > 0
                  ? `/admin/settlement-manage-detail?month=${monthNumeral}&partner=${partnerName}`
                  : `/admin/settlement-manage-detail?month=${monthNumeral}`
              }
            >
              <CommonButton>조회하기</CommonButton>
            </Link>
            <Space w={20} />
            <Link to={`/admin/settlement-manage?month=${monthNumeral}`}>
              <CommonButton>목록으로</CommonButton>
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
              <Button1
                onClick={() => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length > 0) {
                    setIsDeleteModalOpened(true);
                  } else {
                    setNoticeModalStr("선택된 정산내역이 없습니다.");
                    setIsNoticeModalOpened(true);
                  }
                }}
              >
                선택 정산건 삭제
              </Button1>
              <Button1
                onClick={() => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length == 1) {
                    updateEditItems(updatedList[0]);
                    setIsEditModalOpened(true);
                    setIsEdit(true);
                  } else if (updatedList.length == 0) {
                    setNoticeModalStr("선택된 정산내역이 없습니다.");
                    setIsNoticeModalOpened(true);
                  } else {
                    setNoticeModalStr("정산내역 수정은 1개씩만 가능합니다.");
                    setIsNoticeModalOpened(true);
                  }
                }}
              >
                선택 정산건 수정
              </Button1>
              <Button2
                onClick={() => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length > 0) {
                    setIsDeleteShippingFeeModalOpened(true);
                  } else {
                    setNoticeModalStr("선택된 정산내역이 없습니다.");
                    setIsNoticeModalOpened(true);
                  }
                }}
              >
                선택 정산건 배송비 제거
              </Button2>
              <Button1
                onClick={() => {
                  updateEditItems(null);
                  setIsEditModalOpened(true);
                  setIsEdit(false);
                }}
              >
                정산건 추가
              </Button1>
              <Button2
                onClick={async () => {
                  const updatedList = updateCheckedItems();
                  if (updatedList.length > 0) {
                    await writeExcel(updatedList);
                  } else {
                    setNoticeModalStr("선택된 정산내역이 없습니다.");
                    setIsNoticeModalOpened(true);
                  }
                }}
              >
                선택건 엑셀 다운로드
              </Button2>
            </div>
            <div style={{ height: "20px" }} />
            <InfoText>{`* 합배송 정산내역에 대한 배송비는 중복으로 적용되지 않습니다. (주문번호가 동일한 경우)`}</InfoText>
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
      return Number(item.isDiscounted ? item.discountedPrice : item.price);
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
    column: "할인적용",
    type: String,
    value: (item: SettlementItem) => (item.isDiscounted ? "O" : "X"),
    width: 10,
  },
  {
    column: "조정수수료",
    type: Number,
    value: (item: SettlementItem) =>
      Number(item.isDiscounted ? item.lofaAdjustmentFee : "0"),
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
    column: "주문태그",
    type: String,
    value: (item: SettlementItem) => item.orderTag,
    width: 10,
  },
];
