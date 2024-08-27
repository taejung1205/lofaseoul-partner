import { PageLayout } from "~/components/page_layout";
import dayPickerStyles from "react-day-picker/dist/style.css";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Checkbox, LoadingOverlay, Space } from "@mantine/core";
import { BasicModal, ModalButton } from "~/components/modal";
import { MonthSelectPopover, WeekSelectPopover } from "~/components/date";
import {
  dateToDayStr,
  dateToKoreanMonth,
  dateToNumeralMonth,
  dayStrToDate,
  getTimezoneDate,
  koreanMonthToDate,
  numeralMonthToKorean,
} from "~/utils/date";
import { json, LoaderFunction } from "@remix-run/node";
import { CommonButton } from "~/components/button";
import { SellerSelect } from "~/components/seller";
import { endOfMonth, endOfWeek, startOfMonth } from "date-fns";
import { getRevenueData } from "~/services/firebase.server";
import React from "react";
import { RevenueData } from "~/components/revenue_data";
import { StackedBarChartData } from "~/components/chart";

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const periodType = url.searchParams.get("period-type");
  const partnerName = url.searchParams.get("partner-name");
  const productName = url.searchParams.get("product-name");
  const seller = url.searchParams.get("seller");

  if (periodType) {
    if (periodType == "month") {
      const numeralMonth = url.searchParams.get("month");
      if (numeralMonth !== null) {
        const date = koreanMonthToDate(numeralMonthToKorean(numeralMonth));
        const startDate = new Date(startOfMonth(date));
        const endDate = new Date(endOfMonth(date));

        const searchResult = await getRevenueData({
          startDate: startDate,
          endDate: endDate,
          partnerName: partnerName ?? "",
          productName: productName ?? "",
          seller: seller ?? "all",
          orderStatus: "전체",
          cs: "전체",
          filterDiscount: "전체",
        });

        return json({
          status: "ok",
          periodType: "month",
          numeralMonth: numeralMonth,
          partnerName: partnerName,
          productName: productName,
          seller: seller,
          data: searchResult,
        });
      } else {
        return json({
          status: "error",
          message: "검색된 월이 유효하지 않습니다.",
        });
      }
    } else {
      const startDateStr = url.searchParams.get("start-date");
      if (startDateStr == null) {
        return json({
          status: "error",
          message: `검색 조건에 오류가 발생하였습니다.`,
        });
      }

      const startDate = new Date(`${startDateStr}T00:00:00.000+09:00`);
      const endDate = new Date(
        `${dateToDayStr(endOfWeek(startDate))}T23:59:59.000+09:00`
      );

      const searchResult = await getRevenueData({
        startDate: startDate,
        endDate: endDate,
        partnerName: partnerName ?? "",
        productName: productName ?? "",
        seller: seller ?? "all",
        orderStatus: "전체",
        cs: "전체",
        filterDiscount: "전체",
      });

      return json({
        status: "ok",
        periodType: "week",
        startDate: startDateStr,
        partnerName: partnerName,
        productName: productName,
        seller: seller,
        data: searchResult,
      });
    }
  } else {
    return null;
  }
};

export default function Page() {
  const navigation = useNavigation();
  const loaderData = useLoaderData();

  //loaderData에서 불러온 검색한 값들
  const searchedPeriodType = useMemo(() => {
    if (loaderData && loaderData.periodType) {
      return loaderData.periodType;
    } else {
      return undefined;
    }
  }, [loaderData]);

  const searchedDate = useMemo(() => {
    if (loaderData && loaderData.startDate) {
      return dayStrToDate(loaderData.startDate);
    } else if (loaderData && loaderData.numeralMonth) {
      return koreanMonthToDate(numeralMonthToKorean(loaderData.numeralMonth));
    } else {
      return undefined;
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

  const searchedData: StackedBarChartData[] = useMemo(() => {
    if (!loaderData || !loaderData.data) {
      return null;
    } else {
      return loaderData.data.map((val: any) => {
        const data = val.data;
        return {
          name: data.orderDate,
          a: 100,
          b: 200,
          c: 300,
        };
      });
    }
  }, [loaderData]);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [periodType, setPeriodType] = useState<"month" | "week">(
    searchedPeriodType ?? "month"
  );
  const [seller, setSeller] = useState<string>(searchedSeller); // 판매처
  const [partnerName, setPartnerName] = useState<string>(searchedPartnerName); // 공급처
  const [productName, setProductName] = useState<string>(searchedProductName); //상품명

  const [isLoading, setIsLoading] = useState<boolean>(false); //로딩 과정에서 로딩오버레이 표시

  //Modals
  const [noticeModalStr, setNoticeModalStr] = useState<string>("");
  const [isNoticeModalOpened, setIsNoticeModalOpened] =
    useState<boolean>(false);

  const selectedMonthStr = useMemo(() => {
    if (selectedDate) {
      return dateToKoreanMonth(selectedDate);
    } else {
      return undefined;
    }
  }, [selectedDate]);

  const selectedMonthNumeral = useMemo(() => {
    if (selectedDate) {
      return dateToNumeralMonth(selectedDate);
    } else {
      return undefined;
    }
  }, [selectedDate]);

  //loaderData에서 불러온 수익통계내역 전체
  //TODO: remove
  const test = useMemo(() => {
    if (loaderData) {
      console.log("loaderData.data", loaderData.data);
    }
  }, [loaderData]);

  //날짜 수신
  useEffect(() => {
    if (searchedDate) {
      setSelectedDate(searchedDate);
    } else {
      setSelectedDate(getTimezoneDate(new Date()));
    }
  }, []);

  //안내메세지
  useEffect(() => {
    if (loaderData && loaderData.message) {
      setNoticeModalStr(loaderData.message);
      setIsNoticeModalOpened(true);
    }
  }, [loaderData]);

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

      <div style={{ display: "flex", alignItems: "center" }}>
        {/* TODO: 월간, 주간 구분 */}
        <div>기간 구분</div>
        <Space w={15} />
        <div style={{ fontSize: "12px" }}>월간</div>
        <Space w={10} />
        <Checkbox
          color={"gray"}
          size={"xs"}
          checked={periodType == "month"}
          onChange={(event) => {
            setPeriodType(event.currentTarget.checked ? "month" : "week");
          }}
        />
        <Space w={10} />
        <div style={{ fontSize: "12px" }}>주간</div>
        <Space w={10} />
        <Checkbox
          color={"gray"}
          size={"xs"}
          checked={periodType == "week"}
          onChange={(event) => {
            setPeriodType(event.currentTarget.checked ? "week" : "month");
          }}
        />

        <Space w={20} />

        <img src="/images/icon_calendar.svg" />

        {periodType == "month" ? (
          //월간
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
        ) : (
          //주간
          <WeekSelectPopover
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        <Space w={20} />
        <Link
          to={
            periodType == "month"
              ? `/admin/revenue-chart?period-type=${periodType}&month=${selectedMonthNumeral}&seller=${seller}&partner-name=${partnerName}&product-name=${encodeURIComponent(
                  productName
                )}`
              : `/admin/revenue-chart?period-type=${periodType}&start-date=${
                  selectedDate ? dateToDayStr(selectedDate) : ""
                }&seller=${seller}&partner-name=${partnerName}&product-name=${encodeURIComponent(
                  productName
                )}`
          }
        >
          <CommonButton>조회하기</CommonButton>
        </Link>
      </div>
      <Space h={20} />
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>판매처</div>
          <Space w={10} />
          <SellerSelect seller={seller} setSeller={setSeller} />
        </div>
        <Space w={20} />
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
        <Space w={20} />
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
        <Space w={20} />
        <div style={{ display: "flex", alignItems: "center", height: "40px" }}>
          <div>주문태그</div>
          <Space w={10} />
          <div>(WIP)</div>
        </div>
      </div>

      <div>
        <Suspense fallback={<div>Loading... </div>}>
          <MyStackedBarChart data={searchedData ?? []} />
        </Suspense>
      </div>
    </PageLayout>
  );
}

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

const MyStackedBarChart = React.lazy(() =>
  import("~/components/chart").then((module) => ({
    default: module.MyStackedBarChart,
  }))
);
