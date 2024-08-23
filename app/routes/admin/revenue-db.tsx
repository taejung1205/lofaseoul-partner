import { LoadingOverlay, Select, Space } from "@mantine/core";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageLayout } from "~/components/page_layout";
import dayPickerStyles from "react-day-picker/dist/style.css";
import { DaySelectPopover } from "~/components/date";
import { dateToDayStr, dayStrToDate, getTimezoneDate } from "~/utils/date";
import { SellerSelect } from "~/components/seller";
import { BlackButton } from "~/components/button";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  deleteRevenueData,
  getAllPartnerProfiles,
  getAllSellerProfiles,
  getRevenueData,
} from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { RevenueData, RevenueDataTableMemo } from "~/components/revenue_data";
import { PartnerProfile } from "~/components/partner_profile";
import { SellerProfile } from "./seller-manage";

function EditInputBox({
  width,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const inputStyles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    width: width ?? "200px",
    height: "40px",
    border: "3px black solid",
  };
  return <input style={inputStyles} {...props} />;
}

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const isSearched = url.searchParams.get("is-searched");
  if (isSearched !== null) {
    const startDateStr = url.searchParams.get("start-date");
    const endDateStr = url.searchParams.get("end-date");
    if (startDateStr == null || endDateStr == null) {
      return json({
        status: "error",
        message: `검색 조건에 오류가 발생하였습니다.`,
      });
    }
    const partnerName = url.searchParams.get("partner-name");
    const productName = url.searchParams.get("product-name");
    const seller = url.searchParams.get("seller");
    const orderStatus = url.searchParams.get("order-status");
    const cs = url.searchParams.get("cs");
    const filterDiscount = url.searchParams.get("filter-discount");

    const startDate = new Date(`${startDateStr}T00:00:00.000+09:00`);
    const endDate = new Date(`${endDateStr}T23:59:59.000+09:00`);

    if (startDate > endDate) {
      return json({
        status: "error",
        message: `시작일은 종료일보다 앞이여야 합니다.`,
      });
    }

    const searchResult = await getRevenueData({
      startDate: startDate,
      endDate: endDate,
      partnerName: partnerName ?? "",
      productName: productName ?? "",
      seller: seller ?? "all",
      orderStatus: orderStatus ?? "전체",
      cs: cs ?? "전체",
      filterDiscount: filterDiscount ?? "전체",
    });

    const partnersMap = await getAllPartnerProfiles();
    const partnerProfiles = Array.from(partnersMap.values());

    const sellerMap = await getAllSellerProfiles();
    const sellerProfiles = Array.from(sellerMap.values());

    return json({
      status: "ok",
      data: searchResult,
      message: `${searchResult.length}건을 조회하였습니다.`,
      startDate: startDateStr,
      endDate: endDateStr,
      partnerName: partnerName,
      productName: productName,
      seller: seller,
      orderStatus: orderStatus,
      cs: cs,
      filterDiscount: filterDiscount,
      partnerProfiles: partnerProfiles,
      sellerProfiles: sellerProfiles,
    });
  } else {
    return json({
      status: "ok",
      message: "",
    });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const actionType = body.get("action")?.toString();
  if (actionType === "delete") {
    const ids = body.get("ids")?.toString();
    if (ids !== undefined) {
      const result = await deleteRevenueData({
        data: ids,
      });
      if (result === true) {
        return json({
          status: "ok",
          message: `수익통계 자료 삭제 요청이 등록되었습니다. 잠시 후 DB에 반영될 예정입니다.`,
        });
      } else {
        return json({
          status: "error",
          message: `수익통계 자료 삭제 요청 중 문제가 발생하였습니다. 개발자에게 문의해주세요.`,
        });
      }
    }
  }
  return null;
};

export default function Page() {
  const navigation = useNavigation();
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  //loaderData에서 불러온 검색한 값들
  const searchedStartDate = useMemo(() => {
    if (loaderData && loaderData.startDate) {
      return dayStrToDate(loaderData.startDate);
    } else {
      return null;
    }
  }, [loaderData]);

  const searchedEndDate = useMemo(() => {
    if (loaderData && loaderData.endDate) {
      return dayStrToDate(loaderData.endDate);
    } else {
      return null;
    }
  }, [loaderData]);

  const searchedPartnerName = useMemo(() => {
    if (loaderData && loaderData.partnerName) {
      return loaderData.partnerName;
    } else {
      return "";
    }
  }, [loaderData]);

  const searchedProductName = useMemo(() => {
    if (loaderData && loaderData.productName) {
      return loaderData.productName;
    } else {
      return "";
    }
  }, [loaderData]);

  const searchedSeller = useMemo(() => {
    if (loaderData && loaderData.seller) {
      return loaderData.seller;
    } else {
      return "all";
    }
  }, [loaderData]);

  const searchedOrderStatus = useMemo(() => {
    if (loaderData && loaderData.orderStatus) {
      return loaderData.orderStatus;
    } else {
      return "전체";
    }
  }, [loaderData]);

  const searchedCs = useMemo(() => {
    if (loaderData && loaderData.cs) {
      return loaderData.cs;
    } else {
      return "전체";
    }
  }, [loaderData]);

  const searchedFilterDiscount = useMemo(() => {
    if (loaderData && loaderData.filterDiscount) {
      return loaderData.filterDiscount;
    } else {
      return "전체";
    }
  }, [loaderData]);

  const partnerProfiles = useMemo(() => {
    if (loaderData && loaderData.partnerProfiles) {
      const map = new Map<string, any>();
      loaderData.partnerProfiles.forEach((partner: PartnerProfile) => {
        map.set(partner.providerName, partner);
      });
      return map;
    } else {
      return undefined;
    }
  }, [loaderData]);

  const sellerProfiles = useMemo(() => {
    if (loaderData && loaderData.sellerProfiles) {
      const map = new Map<string, any>();
      loaderData.sellerProfiles.forEach((seller: SellerProfile) => {
        map.set(seller.name, seller);
      });
      return map;
    } else {
      return undefined;
    }
  }, [loaderData]);

  //검색조건
  const [startDate, setStartDate] = useState<Date>(); //주문일 시작
  const [endDate, setEndDate] = useState<Date>(); //주문일 종료
  const [seller, setSeller] = useState<string>(searchedSeller); // 판매처
  const [partnerName, setPartnerName] = useState<string>(searchedPartnerName); // 공급처
  const [productName, setProductName] = useState<string>(searchedProductName); //상품명
  const [cs, setCs] = useState<string | null>(searchedCs); //CS
  const [orderStatus, setOrderStatus] = useState<string | null>(
    searchedOrderStatus
  ); //상태
  const [filterDiscount, setFilterDiscount] = useState<string | null>(
    searchedFilterDiscount
  ); //할인여부

  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열
  const [isLoading, setIsLoading] = useState<boolean>(false); //로딩 과정에서 로딩오버레이 표시
  const [isSearchClicked, setIsSearchClicked] = useState<boolean>(false); //action 결과 불러올 때 loaderData 안내 또 열리지 않도록 구분

  //현재 보고 있는 항목 페이지 번호
  //사용자에게 보이는 값은 여기서 +1
  const [pageIndex, setPageIndex] = useState<number>(0);

  //볼 항목 선택
  //TODO

  //모달
  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);
  const [isDeleteModalOpened, setIsDeleteModalOpened] =
    useState<boolean>(false);

  //loaderData에서 불러온 수익통계내역 전체
  const revenueDataItems: { data: RevenueData; id: string }[] = useMemo(() => {
    if (loaderData.status != "error" && loaderData.data) {
      //불러오고 체크 표시 다 초기화될때까지 로딩 표시
      return loaderData.data.map((val: any) => {
        val.data.orderDate = new Date(val.data.orderDate);
        return { data: val.data, id: val.id };
      });
    } else {
      return [];
    }
  }, [loaderData]);

  const revenueData: RevenueData[] = useMemo(() => {
    return revenueDataItems.map((val) => val.data);
  }, [revenueDataItems]);

  //날짜 수신
  useEffect(() => {
    if (searchedStartDate) {
      setStartDate(searchedStartDate);
    } else {
      setStartDate(getTimezoneDate(new Date()));
    }

    if (searchedEndDate) {
      setEndDate(searchedEndDate);
    } else {
      setEndDate(getTimezoneDate(new Date()));
    }
  }, []);

  //안내메세지
  useEffect(() => {
    if (isSearchClicked && loaderData.message.length > 0) {
      setIsSearchClicked(false);
      setNoticeModalStr(loaderData.message);
      setIsNoticeModalOpened(true);
    }
  }, [loaderData]);

  useEffect(() => {
    if (actionData && actionData.message) {
      setNoticeModalStr(actionData.message);
      setIsNoticeModalOpened(true);
    }
  }, [actionData]);

  //처음 불러올 때 체크 초기화
  useEffect(() => {
    setPageIndex(0);
    resetCheck(0);
  }, [revenueDataItems]);

  useEffect(() => {
    resetCheck(pageIndex);
  }, [pageIndex]);

  function resetCheck(pageIndex: number) {
    const newArr = Array(
      Math.min(
        revenueDataItems.slice(pageIndex * 100, (pageIndex + 1) * 100).length,
        100
      )
    ).fill(false);
    setItemsChecked(newArr);
  }

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setIsLoading(true);
    for (let i = 0; i < itemsChecked.length; i++) {
      itemsChecked[i] = isChecked;
    }
    setIsLoading(false);
  }

  async function submitDeleteRevenueData(idList: string[]) {
    console.log("delete add revenue data, length:", idList.length);
    const ids = JSON.stringify(idList);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("ids", ids);
    formData.set("action", "delete");
    submit(formData, { method: "post" });
  }

  return (
    <PageLayout>
      <LoadingOverlay
        visible={navigation.state == "loading" || isLoading}
        overlayBlur={2}
      />
      {/* 안내메세지모달 */}
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

      {/*삭제 모달*/}
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
          선택한 항목들을 삭제하시겠습니까?
          <div style={{ height: "20px" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalButton onClick={() => setIsDeleteModalOpened(false)}>
              취소
            </ModalButton>
            <ModalButton
              onClick={() => {
                setIsLoading(true);
                setIsDeleteModalOpened(false);
                let deletingList = [];
                for (let i = 0; i < itemsChecked.length; i++) {
                  if (itemsChecked[i]) {
                    deletingList.push(revenueDataItems[i + pageIndex * 100].id);
                  }
                }
                setIsLoading(false);
                if (deletingList.length > 0) {
                  submitDeleteRevenueData(deletingList);
                } else {
                  setNoticeModalStr("선택된 항목이 없습니다.");
                  setIsNoticeModalOpened(true);
                }
              }}
              styleOverrides={{
                borderColor: "red",
                color: "red",
              }}
            >
              삭제
            </ModalButton>
          </div>
        </div>
      </BasicModal>

      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>주문일</div>
          <Space w={10} />
          <DaySelectPopover
            selectedDate={startDate}
            setSelectedDate={setStartDate}
          />
          <Space w={5} />
          <div>~</div>
          <Space w={5} />
          <DaySelectPopover
            selectedDate={endDate}
            setSelectedDate={setEndDate}
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>공급처</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="partnerName"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>상품명</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            width={"303px"}
            required
          />
        </div>
      </div>
      <Space h={20} />
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>판매처</div>
          <Space w={10} />
          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>상태</div>
          <Space w={10} />
          <Select
            value={orderStatus}
            onChange={setOrderStatus}
            data={[
              "전체",
              "발주",
              "접수",
              "송장",
              "배송",
              "접수+송장",
              "접수+배송",
              "송장+배송",
            ]}
            styles={{
              input: {
                fontSize: "20px",
                fontWeight: "bold",
                borderRadius: 0,
                border: "3px solid black !important",
                height: "40px",
                width: "170px",
              },
              item: {
                "&[data-selected]": {
                  backgroundColor: "grey",
                },
              },
            }}
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>CS</div>
          <Space w={10} />
          <Select
            value={cs}
            onChange={setCs}
            data={[
              "전체",
              "정상",
              "정상+교환",
              "취소(배송전+배송후)",
              "교환(배송전+배송후)",
              "배송전 취소",
              "배송후 취소",
              "배송전 교환",
              "배송후 교환",
              "보류",
              "맞교환",
              "배송후교환C",
              "부분취소",
              "부분취소 제외",
            ]}
            styles={{
              input: {
                fontSize: "20px",
                fontWeight: "bold",
                borderRadius: 0,
                border: "3px solid black !important",
                height: "40px",
                width: "250px",
              },
              item: {
                "&[data-selected]": {
                  backgroundColor: "grey",
                },
              },
            }}
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>할인여부</div>
          <Space w={10} />
          <Select
            value={filterDiscount}
            onChange={setFilterDiscount}
            data={["전체", "할인 있음", "할인 없음"]}
            styles={{
              input: {
                fontSize: "20px",
                fontWeight: "bold",
                borderRadius: 0,
                border: "3px solid black !important",
                height: "40px",
                width: "150px",
              },
              item: {
                "&[data-selected]": {
                  backgroundColor: "grey",
                },
              },
            }}
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <Link
            to={`/admin/revenue-db?is-searched=true&start-date=${
              startDate ? dateToDayStr(startDate) : ""
            }&end-date=${
              endDate ? dateToDayStr(endDate) : ""
            }&seller=${seller}&partner-name=${partnerName}&product-name=${encodeURIComponent(
              productName
            )}&order-status=${encodeURIComponent(
              orderStatus ?? "전체"
            )}&cs=${encodeURIComponent(
              cs ?? "전체"
            )}&filterDiscount=${encodeURIComponent(filterDiscount ?? "전체")}`}
            onClick={() => setIsSearchClicked(true)}
          >
            <BlackButton>검색</BlackButton>
          </Link>
        </div>
      </div>
      <Space h={20} />
      {/* TODO: 볼 항목 선택 */}
      {revenueDataItems ? (
        <RevenueDataTableMemo
          items={revenueData.slice(pageIndex * 100, (pageIndex + 1) * 100)}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={false}
          isDBTable={true}
          partnerProfiles={partnerProfiles}
          sellerProfiles={sellerProfiles}
        />
      ) : (
        <></>
      )}
      {revenueDataItems ? (
        <PageIndex
          pageCount={Math.ceil(revenueDataItems.length / 100)}
          currentIndex={pageIndex}
          onIndexClick={(index: number) => {
            setPageIndex(index);
            resetCheck(index);
          }}
        />
      ) : (
        <></>
      )}

      <Space h={20} />
      <BlackButton onClick={() => setIsDeleteModalOpened(true)}>
        선택 항목 삭제
      </BlackButton>
    </PageLayout>
  );
}

function PageIndex({
  pageCount,
  currentIndex,
  onIndexClick,
}: {
  pageCount: number;
  currentIndex: number;
  onIndexClick: (index: number) => void;
}) {
  let arr = [];
  for (let i = 0; i < pageCount; i++) {
    arr.push(i);
  }
  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
      {arr.map((item, index) => (
        <div
          key={`PageIndex-${index}`}
          style={{
            fontWeight: item == currentIndex ? 700 : 400,
            margin: 5,
            cursor: "pointer",
          }}
          onClick={() => {
            onIndexClick(item);
          }}
        >
          {item + 1}
        </div>
      ))}
    </div>
  );
}
