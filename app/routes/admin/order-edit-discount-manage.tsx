import { LoadingOverlay, Space } from "@mantine/core";
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
import { BlackButton } from "~/components/button";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  deleteDiscountData,
  getDiscountData,
} from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { DiscountData, DiscountDataTableMemo } from "~/components/discount";

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

    const startDate = new Date(`${startDateStr}T00:00:00Z`);
    const endDate = new Date(`${endDateStr}T23:59:59Z`);

    const searchResult = await getDiscountData({
      startDate: startDate,
      endDate: endDate,
      partnerName: partnerName ?? "",
      productName: productName ?? "",
    });
    return json({
      status: "ok",
      data: searchResult,
      message: `${searchResult.length}건을 조회하였습니다.`,
      startDate: startDateStr,
      endDate: endDateStr,
      partnerName: partnerName,
      productName: productName,
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
      const result = await deleteDiscountData({
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

  //검색조건
  const [startDate, setStartDate] = useState<Date>(); //검색기준일 시작
  const [endDate, setEndDate] = useState<Date>(); //검색기준일 종료
  const [partnerName, setPartnerName] = useState<string>(searchedPartnerName); // 공급처
  const [productName, setProductName] = useState<string>(searchedProductName); //상품명

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
  const discountDataItems: { data: DiscountData; id: string }[] =
    useMemo(() => {
      if (loaderData.status != "error" && loaderData.data) {
        //불러오고 체크 표시 다 초기화될때까지 로딩 표시
        return loaderData.data.map((val: any) => {
          val.data.startDate = new Date(val.data.startDate);
          val.data.endDate = new Date(val.data.endDate);
          return { data: val.data, id: val.id };
        });
      } else {
        return [];
      }
    }, [loaderData]);

  const discountData: DiscountData[] = useMemo(() => {
    return discountDataItems.map((val) => val.data);
  }, [discountDataItems]);

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
  }, [discountDataItems]);

  useEffect(() => {
    resetCheck(pageIndex);
  }, [pageIndex]);

  function resetCheck(pageIndex: number) {
    const newArr = Array(
      Math.min(
        discountDataItems.slice(pageIndex * 100, (pageIndex + 1) * 100).length,
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

  async function submitDeleteDiscountData(idList: string[]) {
    console.log("delete add discount data, length:", idList.length);
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
                    deletingList.push(
                      discountDataItems[i + pageIndex * 100].id
                    );
                  }
                }
                setIsLoading(false);
                if (deletingList.length > 0) {
                  submitDeleteDiscountData(deletingList);
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
          <div>검색일자</div>
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
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <Link
            to={`/admin/order-edit-discount-manage?is-searched=true&start-date=${
              startDate ? dateToDayStr(startDate) : ""
            }&end-date=${
              endDate ? dateToDayStr(endDate) : ""
            }&partner-name=${partnerName}&product-name=${encodeURIComponent(
              productName
            )}`}
            onClick={() => setIsSearchClicked(true)}
          >
            <BlackButton>검색</BlackButton>
          </Link>
        </div>
      </div>
      <Space h={20} />
      {/* TODO: 볼 항목 선택 */}
      {discountDataItems ? (
        <DiscountDataTableMemo
          items={discountData.slice(pageIndex * 100, (pageIndex + 1) * 100)}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={false}
        />
      ) : (
        <></>
      )}
      {discountDataItems ? (
        <PageIndex
          pageCount={Math.ceil(discountDataItems.length / 100)}
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
