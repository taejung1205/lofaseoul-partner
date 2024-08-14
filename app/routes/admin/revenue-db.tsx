import { LoadingOverlay, Space } from "@mantine/core";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "~/components/page_layout";
import dayPickerStyles from "react-day-picker/dist/style.css";
import { DaySelectPopover } from "~/components/date";
import { getTimezoneDate } from "~/utils/date";
import { SellerSelect } from "~/components/seller";
import { BlackButton } from "~/components/button";
import { json, LoaderFunction } from "@remix-run/node";
import { getRevenueData } from "~/services/firebase.server";
import { BasicModal, ModalButton } from "~/components/modal";
import { RevenueData, RevenueDataTableMemo } from "~/components/revenue_data";
import { DocumentData } from "firebase/firestore";

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
    const searchResult = await getRevenueData({});
    return json({
      status: "ok",
      data: searchResult,
      message: `${searchResult.length}건을 조회하였습니다.`,
    });
  } else {
    return null;
  }
};

export default function Page() {
  const navigation = useNavigation();

  const [startDate, setStartDate] = useState<Date>(); //주문일 시작
  const [endDate, setEndDate] = useState<Date>(); //주문일 종료
  const [seller, setSeller] = useState<string>("all"); // 판매처
  const [partnerName, setPartnerName] = useState<string>(""); // 공급처
  const [productName, setProductName] = useState<string>(""); //상품명
  const [cs, setCs] = useState<string>(""); //CS
  const [orderStatus, setOrderStatus] = useState<string>(""); //상태
  const [filterDiscount, setFilterDiscount] = useState<string>(""); //할인여부

  const [itemsChecked, setItemsChecked] = useState<boolean[]>([]); //체크된 정산내역 index 배열

  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const loaderData = useLoaderData();

  //loaderData에서 불러온 수익통계내역 전체
  const revenueData: { data: RevenueData; id: string }[] = useMemo(() => {
    if (loaderData && loaderData.status != "error") {
      return loaderData.data.map((val: any) => {
        val.data.orderDate = new Date(val.data.orderDate);
        return { data: val.data, id: val.id };
      });
    } else {
      return [];
    }
  }, [loaderData]);

  //날짜 수신
  useEffect(() => {
    setStartDate(getTimezoneDate(new Date()));
    setEndDate(getTimezoneDate(new Date()));
  }, []);

  useEffect(() => {
    if (loaderData) {
      setNoticeModalStr(loaderData.message);
      setIsNoticeModalOpened(true);
    }
  }, [loaderData]);

  function onItemCheck(index: number, isChecked: boolean) {
    itemsChecked[index] = isChecked;
  }

  function onCheckAll(isChecked: boolean) {
    setItemsChecked(Array(revenueData.length).fill(isChecked));
  }

  return (
    <PageLayout>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
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
          <EditInputBox
            type="text"
            name="orderStatus"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            width={"150px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>CS</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="cs"
            value={cs}
            onChange={(e) => setCs(e.target.value)}
            width={"150px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>할인여부</div>
          <Space w={10} />
          <EditInputBox
            type="text"
            name="filterDiscount"
            value={filterDiscount}
            onChange={(e) => setFilterDiscount(e.target.value)}
            width={"150px"}
            required
          />
        </div>
        <Space w={30} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <Link to={`/admin/revenue-db?is-searched=true`}>
            <BlackButton>검색</BlackButton>
          </Link>
        </div>
      </div>
      <Space h={20} />
      {revenueData ? (
        <RevenueDataTableMemo
          items={revenueData.map((val) => val.data)}
          itemsChecked={itemsChecked}
          onItemCheck={onItemCheck}
          onCheckAll={onCheckAll}
          defaultAllCheck={true}
        />
      ) : (
        <></>
      )}
    </PageLayout>
  );
}
