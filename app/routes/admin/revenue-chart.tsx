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
  getTotalWeeksInMonth,
  getWeekOfMonth,
  koreanMonthToDate,
  numeralMonthToKorean,
} from "~/utils/date";
import { json, LoaderFunction } from "@remix-run/node";
import { CommonButton } from "~/components/button";
import {
  LofaSellers,
  PossibleSellers,
  SellerSelect,
} from "~/components/seller";
import { endOfMonth, endOfWeek, getWeek, startOfMonth } from "date-fns";
import {
  getAllPartnerProfiles,
  getAllSellerProfiles,
  getRevenueData,
} from "~/services/firebase.server";
import React from "react";
import {
  getProceeds,
  getSalesAmount,
  RevenueData,
} from "~/components/revenue_data";
import { BarChartData, BarChartInput } from "~/components/chart";
import { PartnerProfile } from "~/components/partner_profile";
import { CommonSelect } from "~/components/select";
import { SellerProfile } from "./seller-manage";

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const periodType = url.searchParams.get("period-type");

  const partnersMap = await getAllPartnerProfiles();
  const partnerProfiles = Array.from(partnersMap.values());

  const sellerMap = await getAllSellerProfiles();
  const sellerProfiles = Array.from(sellerMap.values());

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
          partnerName: "",
          productName: "",
          seller: "all",
          orderStatus: "전체",
          cs: "전체",
          filterDiscount: "전체",
        });

        const searchResultData = searchResult.map((val) => val.data);

        return json({
          status: "ok",
          periodType: "month",
          numeralMonth: numeralMonth,
          data: searchResultData,
          partnerProfiles: partnerProfiles,
          sellerProfiles: sellerProfiles,
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
          partnerProfiles: partnerProfiles,
          sellerProfiles: sellerProfiles,
        });
      }

      const startDate = new Date(`${startDateStr}T00:00:00.000+09:00`);
      const endDate = new Date(
        `${dateToDayStr(endOfWeek(startDate))}T23:59:59.000+09:00`
      );

      const searchResult = await getRevenueData({
        startDate: startDate,
        endDate: endDate,
        partnerName: "",
        productName: "",
        seller: "all",
        orderStatus: "전체",
        cs: "전체",
        filterDiscount: "전체",
      });

      const searchResultData = searchResult.map((val) => val.data);

      return json({
        status: "ok",
        periodType: "week",
        startDate: startDateStr,
        data: searchResultData,
        partnerProfiles: partnerProfiles,
        sellerProfiles: sellerProfiles,
      });
    }
  } else {
    return json({
      status: "ok",
      partnerProfiles: partnerProfiles,
      sellerProfiles: sellerProfiles,
    });
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

  const searchedData: RevenueData[] | undefined = useMemo(() => {
    if (!loaderData || !loaderData.data) {
      return undefined;
    } else {
      return loaderData.data.map((val: RevenueData) => {
        val.orderDate = new Date(val.orderDate);
        return val;
      });
    }
  }, [loaderData]);

  const partnerProfiles = useMemo(() => {
    if (loaderData && loaderData.partnerProfiles) {
      const map = new Map<string, PartnerProfile>();
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

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [periodType, setPeriodType] = useState<"month" | "week">(
    searchedPeriodType ?? "month"
  );
  const [seller, setSeller] = useState<string>("all"); // 판매처
  const [partnerName, setPartnerName] = useState<string>("전체"); // 공급처
  const [productName, setProductName] = useState<string>(""); //상품명

  const [sellerList, setSellerList] = useState<string[]>([]);
  const [partnerNameList, setPartnerNameList] = useState<string[]>([]);
  const [productNameList, setProductNameList] = useState<string[]>([]);

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

  const searchedProductNames = useMemo(() => {
    if (!searchedData || !searchedDate) {
      return undefined;
    }
    const productNames: string[] = [];
    searchedData.forEach((data) => {
      if (!productNames.includes(data.productName)) {
        productNames.push(data.productName);
      }
    });
    return productNames;
  }, [searchedData]);

  const barChartInputData: BarChartInput | undefined = useMemo(() => {
    if (!searchedData || !searchedDate || !partnerProfiles || !sellerProfiles) {
      return undefined;
    }

    const filteredSearchedData = filterSearchedData(
      searchedData,
      sellerList,
      partnerNameList,
      productNameList
    );

    const chartData: BarChartData[] = [];
    const sellers: string[] = [];

    if (searchedPeriodType == "week") {
      let curDate = new Date(searchedDate);
      for (let i = 0; i < 7; i++) {
        chartData.push({
          name: dateToDayStr(curDate),
          EQL_sales: 0,
          EQL_proceeds: 0,
          로파공홈_sales: 0,
          로파공홈_proceeds: 0,
          용산쇼룸_sales: 0,
          용산쇼룸_proceeds: 0,
          예약거래_sales: 0,
          예약거래_proceeds: 0,
          오늘의집_sales: 0,
          오늘의집_proceeds: 0,
          카카오_sales: 0,
          카카오_proceeds: 0,
          무신사_sales: 0,
          무신사_proceeds: 0,
        });
        curDate.setDate(curDate.getDate() + 1);
      }

      for (const data of filteredSearchedData) {
        const dayStr = dateToDayStr(data.orderDate);
        const barChartEntry = chartData.find((entry) => entry.name === dayStr);
        if (barChartEntry) {
          const result = fillBarChartData(barChartEntry, data);
          if (!result) {
            return undefined;
          }
        } else {
          chartData.push({
            name: dayStr,
            EQL_sales: 0,
            EQL_proceeds: 0,
            로파공홈_sales: 0,
            로파공홈_proceeds: 0,
            용산쇼룸_sales: 0,
            용산쇼룸_proceeds: 0,
            예약거래_sales: 0,
            예약거래_proceeds: 0,
            오늘의집_sales: 0,
            오늘의집_proceeds: 0,
            카카오_sales: 0,
            카카오_proceeds: 0,
            무신사_sales: 0,
            무신사_proceeds: 0,
          });
        }
        if (!sellers.includes(data.seller)) {
          sellers.push(data.seller);
        }
      }
      return { sellers: sellers, data: chartData };
    } else if (searchedPeriodType == "month") {
      const numberOfWeeks = getTotalWeeksInMonth(searchedDate);
      for (let i = 0; i < numberOfWeeks; i++) {
        chartData.push({
          name: `${searchedDate.getMonth() + 1}월 ${i + 1}주차`,
          EQL_sales: 0,
          EQL_proceeds: 0,
          로파공홈_sales: 0,
          로파공홈_proceeds: 0,
          용산쇼룸_sales: 0,
          용산쇼룸_proceeds: 0,
          예약거래_sales: 0,
          예약거래_proceeds: 0,
          오늘의집_sales: 0,
          오늘의집_proceeds: 0,
          카카오_sales: 0,
          카카오_proceeds: 0,
          무신사_sales: 0,
          무신사_proceeds: 0,
        });
      }
      for (const data of filteredSearchedData) {
        const week = getWeekOfMonth(data.orderDate);
        const barChartEntry = chartData[week - 1];
        const result = fillBarChartData(barChartEntry, data);
        if (!result) {
          return undefined;
        }
        if (!sellers.includes(data.seller)) {
          sellers.push(data.seller);
        }
      }
      return { sellers: sellers, data: chartData };
    } else {
      return undefined;
    }
  }, [searchedData, sellerList, productNameList, partnerNameList]);

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

  function addSeller(seller: string) {
    setSellerList((prev) => [...prev, seller]);
  }

  function addPartnerName(partnerName: string) {
    setPartnerNameList((prev) => [...prev, partnerName]);
  }

  function addProductName(productName: string) {
    setProductNameList((prev) => [...prev, productName]);
  }

  function deleteSeller(index: number) {
    const first1 = sellerList.slice(0, index);
    const last1 = sellerList.slice(index + 1);
    setSellerList(first1.concat(last1));
    if (first1.concat(last1).length == 0) {
      setSeller("all");
    }
  }

  function deletePartnerName(index: number) {
    const first1 = partnerNameList.slice(0, index);
    const last1 = partnerNameList.slice(index + 1);
    setPartnerNameList(first1.concat(last1));
    if (first1.concat(last1).length == 0) {
      setPartnerName("전체");
    }
  }

  function deleteProductName(index: number) {
    const first1 = productNameList.slice(0, index);
    const last1 = productNameList.slice(index + 1);
    setProductNameList(first1.concat(last1));
    if (first1.concat(last1).length == 0) {
      setProductName("전체");
    }
  }

  function filterSearchedData(
    searchedData: RevenueData[],
    sellers: string[],
    partnerNames: string[],
    productNames: string[]
  ): RevenueData[] {
    return searchedData.filter((data) => {
      const isSellerSatisfied =
        sellers.length > 0 ? sellers.includes(data.seller) : true;
      const isPartnerNameSatisfied =
        partnerNames.length > 0
          ? partnerNames.includes(data.partnerName)
          : true;
      const isProductNameSatisfied =
        productNames.length > 0
          ? productNames.includes(data.productName)
          : true;
      return (
        isSellerSatisfied && isPartnerNameSatisfied && isProductNameSatisfied
      );
    });
  }

  function fillBarChartData(barChartData: BarChartData, data: RevenueData) {
    const salesKey = `${data.seller}_sales` as keyof BarChartData;
    const salesAmount = getSalesAmount(data);

    (barChartData[salesKey] as number) =
      ((barChartData[salesKey] as number) ?? 0) + salesAmount;

    const proceedsKey = `${data.seller}_proceeds` as keyof BarChartData;

    const partnerProfile = partnerProfiles?.get(data.partnerName);

    if (!partnerProfile) {
      setNoticeModalStr(
        `해당 공급처 정보를 불러오는 데에 실패했습니다. ${data.partnerName}`
      );
      setIsNoticeModalOpened(true);
      return false;
    }

    const sellerProfile = sellerProfiles?.get(data.seller);

    const commonFeeRate = LofaSellers.includes(data.seller)
      ? partnerProfile.lofaFee
      : partnerProfile.otherFee;

    const platformFeeRate = sellerProfile ? sellerProfile.fee : 0;

    const proceeds = getProceeds(data, commonFeeRate, platformFeeRate);

    (barChartData[proceedsKey] as number) =
      ((barChartData[proceedsKey] as number) ?? 0) + proceeds;
    return true;
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
              ? `/admin/revenue-chart?period-type=${periodType}&month=${selectedMonthNumeral}`
              : `/admin/revenue-chart?period-type=${periodType}&start-date=${
                  selectedDate ? dateToDayStr(selectedDate) : ""
                }`
          }
        >
          <CommonButton>조회하기</CommonButton>
        </Link>
      </div>
      <Space h={40} />

      <div style={{ display: "flex" }}>
        {barChartInputData ? (
          <Suspense fallback={<EmptyChart text={"데이터를 불러오는 중..."} />}>
            <MyStackedBarChart
              chartData={barChartInputData ?? { sellers: [], data: [] }}
            />
          </Suspense>
        ) : (
          <EmptyChart text={"날짜 입력 후 데이터 조회가 가능합니다."} />
        )}

        <Space w={20} />
        <div style={{}}>
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <div>판매처</div>
            <Space w={10} />
            <SellerSelect
              seller={seller}
              setSeller={(seller: string) => {
                setSeller(seller);
                if (!sellerList.includes(seller)) {
                  if(seller != "all"){
                    addSeller(seller);
                  } else {
                    setSellerList([]);
                  }
                }
              }}
            />
          </div>
          <Space h={10} />
          <div style={{ display: "flex" }}>
            {sellerList.map((item, index) => {
              return (
                <div
                  key={`SellerListItem-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    border: "0.5px solid black",
                    padding: "5px",
                    margin: "3px",
                  }}
                >
                  <div style={{ fontSize: "12px" }}>{item}</div>
                  <Space w={5} />
                  <DeleteButton
                    onClick={() => {
                      deleteSeller(index);
                    }}
                  />
                </div>
              );
            })}
          </div>

          <Space h={20} />
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <div>공급처</div>
            <Space w={10} />
            <CommonSelect
              selected={partnerName}
              setSelected={(partnerName: string) => {
                setPartnerName(partnerName);
                if (partnerName == "전체") {
                  setPartnerNameList([]);
                  return;
                }
                if (!partnerNameList.includes(partnerName)) {
                  addPartnerName(partnerName);
                }
              }}
              items={
                partnerProfiles
                  ? ["전체", ...Array.from(partnerProfiles.keys())]
                  : []
              }
              width="400px"
            />
          </div>
          <Space h={10} />
          <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "400px" }}>
            {partnerNameList.map((item, index) => {
              return (
                <div
                  key={`PartnerNameListItem-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    border: "0.5px solid black",
                    padding: "5px",
                    margin: "3px",
                  }}
                >
                  <div style={{ fontSize: "12px" }}>{item}</div>
                  <Space w={5} />
                  <DeleteButton
                    onClick={() => {
                      deletePartnerName(index);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <Space h={20} />
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <div>상품명</div>
            <Space w={10} />
            <CommonSelect
              selected={productName}
              setSelected={(productName: string) => {
                setProductName(productName);
                if (productName == "전체") {
                  setProductNameList([]);
                  return;
                }
                if (!productNameList.includes(productName)) {
                  addProductName(productName);
                }
              }}
              items={
                searchedProductNames ? ["전체", ...searchedProductNames] : []
              }
              width="400px"
            />
          </div>
          <Space h={10} />
          <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "400px" }}>
            {productNameList.map((item, index) => {
              return (
                <div
                  key={`ProductNameListItem-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    border: "0.5px solid black",
                    padding: "5px",
                    margin: "3px",
                  }}
                >
                  <div style={{ fontSize: "12px" }}>{item}</div>
                  <Space w={5} />
                  <DeleteButton
                    onClick={() => {
                      deleteProductName(index);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <Space h={20} />
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <div>주문태그</div>
            <Space w={10} />
            <div>(WIP)</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styleoverrides?: React.CSSProperties;
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

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <img
      src="/images/icon_trash.svg"
      style={{ cursor: "pointer", width: "10px", height: "10px" }}
      onClick={onClick}
    />
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div
      style={{
        width: 1000,
        height: 500,
        border: "1px solid black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {text}
    </div>
  );
}

const MyStackedBarChart = React.lazy(() =>
  import("~/components/chart").then((module) => ({
    default: module.MyStackedBarChart,
  }))
);
