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
import { LofaSellers, SellerSelect } from "~/components/seller";
import { endOfMonth, endOfWeek, startOfMonth } from "date-fns";
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
import {
  BarGraphData,
  BarGraphInput,
  LineGraphData,
  LineGraphInput,
} from "~/components/graph";
import {
  getAllProductCategories,
  PartnerProfile,
  ProductCategoryItem,
} from "~/components/partner_profile";
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
          productCategory: [], //TODO
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
        `${dateToDayStr(endOfWeek(new Date(startDateStr)), false)}T23:59:59.000+09:00`
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
        productCategory: [], //TODO
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

  const allPartnerProfiles = useMemo(() => {
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

  const allSellerProfiles = useMemo(() => {
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

  const allProductCategories = useMemo(() => {
    if (allPartnerProfiles) {
      return getAllProductCategories(Array.from(allPartnerProfiles.values()));
    } else {
      return undefined;
    }
  }, [allPartnerProfiles]);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [periodType, setPeriodType] = useState<"month" | "week">(
    searchedPeriodType ?? "month"
  );
  const [seller, setSeller] = useState<string>("all"); // 판매처
  const [partnerName, setPartnerName] = useState<string>("전체"); // 공급처
  const [productName, setProductName] = useState<string>(""); //상품명
  const [productCategory, setProductCategory] = useState<string>("전체");

  const [sellerList, setSellerList] = useState<string[]>([]);
  const [partnerNameList, setPartnerNameList] = useState<string[]>([]);
  const [productNameList, setProductNameList] = useState<string[]>([]);
  const [productCategoryList, setProductCategoryList] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false); //로딩 과정에서 로딩오버레이 표시

  const [graphType, setChartType] = useState<
    "전체 매출/수익" | "매출 TOP 5" | "수익 TOP 5" | "구매수량 TOP 5"
  >("전체 매출/수익"); //막대그래프인지 (아니면 꺾은선그래프)

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

  //판매처, 공급처, 상품명, 상품분류로 필터링
  const filteredSearchedDataBarGraph = useMemo(() => {
    if (!searchedData) {
      return undefined;
    }

    return filterSearchedData(
      searchedData,
      sellerList,
      partnerNameList,
      productNameList,
      productCategoryList
    );
  }, [
    searchedData,
    sellerList,
    partnerNameList,
    productNameList,
    productCategoryList,
  ]);

  //판매처, 상품분류로 필터링
  const filteredSearchedDataLineGraph = useMemo(() => {
    if (!searchedData) {
      return undefined;
    }

    return filterSearchedData(
      searchedData,
      sellerList,
      [],
      [],
      productCategoryList
    );
  }, [searchedData, sellerList, productCategoryList]);

  const barGraphInput: BarGraphInput | undefined = useMemo(() => {
    if (!searchedDate || !filteredSearchedDataBarGraph) {
      return undefined;
    }

    const chartData: BarGraphData[] = [];
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

      for (const data of filteredSearchedDataBarGraph) {
        const dayStr = dateToDayStr(data.orderDate);
        const barGraphEntry = chartData.find((entry) => entry.name === dayStr);
        if (barGraphEntry) {
          const result = fillBarGraphData(barGraphEntry, data);
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
      for (const data of filteredSearchedDataBarGraph) {
        const week = getWeekOfMonth(data.orderDate);
        const barGraphEntry = chartData[week - 1];
        const result = fillBarGraphData(barGraphEntry, data);
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
  }, [filteredSearchedDataBarGraph, searchedDate]);

  const salesTop5LineGraphInput: LineGraphInput | undefined = useMemo(() => {
    if (!searchedDate || !filteredSearchedDataLineGraph) {
      return undefined;
    }

    // 1. 가장 매출이 높은 5개의 상품 추출
    const top5Products = getSalesTop5Products(filteredSearchedDataLineGraph);

    // 2. 선택된 5개의 상품 이름을 배열로 저장
    const top5ProductNames = top5Products.map((product) => product.productName);

    // 3. 일자별 매출 합계를 계산할 Map 생성
    const lineGraphDataMap = new Map<string, Map<string, number>>();

    let curDate = new Date(searchedDate);
    const dateList: string[] = [];

    // 전체 기간 동안의 날짜 리스트 생성
    if (searchedPeriodType == "week") {
      for (let i = 0; i < 7; i++) {
        // 이 부분은 필요에 따라 조정하세요.
        const dateKey = curDate.toISOString().split("T")[0];
        dateList.push(dateKey);
        curDate.setDate(curDate.getDate() + 1);
      }
    } else if (searchedPeriodType == "month") {
      const numberOfWeeks = getTotalWeeksInMonth(searchedDate);
      for (let i = 0; i < numberOfWeeks; i++) {
        const dateKey = `${searchedDate.getMonth() + 1}월 ${i + 1}주차`;
        dateList.push(dateKey);
      }
    } else {
      return undefined;
    }

    filteredSearchedDataLineGraph.forEach((item) => {
      if (top5ProductNames.includes(item.productName)) {
        let dateKey = "";
        if (searchedPeriodType == "week") {
          dateKey = item.orderDate.toISOString().split("T")[0];
        } else {
          const week = getWeekOfMonth(item.orderDate);
          dateKey = `${searchedDate.getMonth() + 1}월 ${week}주차`;
        }

        const productMap =
          lineGraphDataMap.get(dateKey) || new Map<string, number>();

        const currentRevenue = productMap.get(item.productName) || 0;
        productMap.set(item.productName, currentRevenue + getSalesAmount(item));

        lineGraphDataMap.set(dateKey, productMap);
      }
    });

    // 4. Map을 LineGraphData[]로 변환
    const lineGraphData: LineGraphData[] = [];
    dateList.forEach((dateKey) => {
      const productMap =
        lineGraphDataMap.get(dateKey) || new Map<string, number>();
      top5ProductNames.forEach((productName) => {
        const sales = productMap.get(productName) || 0;
        lineGraphData.push({ name: dateKey, productName, value: sales });
      });
    });

    return { data: lineGraphData };
  }, [filteredSearchedDataLineGraph, searchedDate]);

  const proceedsTop5LineGraphInput: LineGraphInput | undefined = useMemo(() => {
    if (!searchedDate || !filteredSearchedDataLineGraph) {
      return undefined;
    }

    // 1. 가장 매출이 높은 5개의 상품 추출
    const top5Products = getProceedsTop5Products(filteredSearchedDataLineGraph);

    // 2. 선택된 5개의 상품 이름을 배열로 저장
    const top5ProductNames = top5Products.map((product) => product.productName);

    // 3. 일자별 매출 합계를 계산할 Map 생성
    const lineGraphDataMap = new Map<string, Map<string, number>>();

    let curDate = new Date(searchedDate);
    const dateList: string[] = [];

    // 전체 기간 동안의 날짜 리스트 생성
    if (searchedPeriodType == "week") {
      for (let i = 0; i < 7; i++) {
        // 이 부분은 필요에 따라 조정하세요.
        const dateKey = curDate.toISOString().split("T")[0];
        dateList.push(dateKey);
        curDate.setDate(curDate.getDate() + 1);
      }
    } else if (searchedPeriodType == "month") {
      const numberOfWeeks = getTotalWeeksInMonth(searchedDate);
      for (let i = 0; i < numberOfWeeks; i++) {
        const dateKey = `${searchedDate.getMonth() + 1}월 ${i + 1}주차`;
        dateList.push(dateKey);
      }
    } else {
      return undefined;
    }

    filteredSearchedDataLineGraph.forEach((item) => {
      if (top5ProductNames.includes(item.productName)) {
        let dateKey = "";
        if (searchedPeriodType == "week") {
          dateKey = item.orderDate.toISOString().split("T")[0];
        } else {
          const week = getWeekOfMonth(item.orderDate);
          dateKey = `${searchedDate.getMonth() + 1}월 ${week}주차`;
        }
        const productMap =
          lineGraphDataMap.get(dateKey) || new Map<string, number>();

        const currentProceeds = productMap.get(item.productName) || 0;
        productMap.set(
          item.productName,
          currentProceeds + getProceedsFromItem(item)
        );

        lineGraphDataMap.set(dateKey, productMap);
      }
    });

    // 4. Map을 LineGraphData[]로 변환
    const lineGraphData: LineGraphData[] = [];
    dateList.forEach((dateKey) => {
      const productMap =
        lineGraphDataMap.get(dateKey) || new Map<string, number>();
      top5ProductNames.forEach((productName) => {
        const proceeds = productMap.get(productName) || 0;
        lineGraphData.push({ name: dateKey, productName, value: proceeds });
      });
    });

    return { data: lineGraphData };
  }, [filteredSearchedDataLineGraph, searchedDate]);

  const amountTop5LineGraphInput: LineGraphInput | undefined = useMemo(() => {
    if (!searchedDate || !filteredSearchedDataLineGraph) {
      return undefined;
    }

    // 1. 가장 매출이 높은 5개의 상품 추출
    const top5Products = getAmountTop5Products(filteredSearchedDataLineGraph);

    // 2. 선택된 5개의 상품 이름을 배열로 저장
    const top5ProductNames = top5Products.map((product) => product.productName);

    // 3. 일자별 매출 합계를 계산할 Map 생성
    const lineGraphDataMap = new Map<string, Map<string, number>>();

    let curDate = new Date(searchedDate);
    const dateList: string[] = [];

    // 전체 기간 동안의 날짜 리스트 생성
    if (searchedPeriodType == "week") {
      for (let i = 0; i < 7; i++) {
        // 이 부분은 필요에 따라 조정하세요.
        const dateKey = curDate.toISOString().split("T")[0];
        dateList.push(dateKey);
        curDate.setDate(curDate.getDate() + 1);
      }
    } else if (searchedPeriodType == "month") {
      const numberOfWeeks = getTotalWeeksInMonth(searchedDate);
      for (let i = 0; i < numberOfWeeks; i++) {
        const dateKey = `${searchedDate.getMonth() + 1}월 ${i + 1}주차`;
        dateList.push(dateKey);
      }
    } else {
      return undefined;
    }

    filteredSearchedDataLineGraph.forEach((item) => {
      if (top5ProductNames.includes(item.productName)) {
        let dateKey = "";
        if (searchedPeriodType == "week") {
          dateKey = item.orderDate.toISOString().split("T")[0];
        } else {
          const week = getWeekOfMonth(item.orderDate);
          dateKey = `${searchedDate.getMonth() + 1}월 ${week}주차`;
        }
        const productMap =
          lineGraphDataMap.get(dateKey) || new Map<string, number>();

        const currentAmount = productMap.get(item.productName) || 0;
        productMap.set(item.productName, currentAmount + item.amount);

        lineGraphDataMap.set(dateKey, productMap);
      }
    });

    // 4. Map을 LineGraphData[]로 변환
    const lineGraphData: LineGraphData[] = [];
    dateList.forEach((dateKey) => {
      const productMap =
        lineGraphDataMap.get(dateKey) || new Map<string, number>();
      top5ProductNames.forEach((productName) => {
        const amount = productMap.get(productName) || 0;
        lineGraphData.push({ name: dateKey, productName, value: amount });
      });
    });

    return { data: lineGraphData, unit: "개" };
  }, [filteredSearchedDataLineGraph, searchedDate]);

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

  function addProductCategory(productCategory: string) {
    setProductCategoryList((prev) => [...prev, productCategory]);
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

  function deleteProductCategory(index: number) {
    const first1 = productCategoryList.slice(0, index);
    const last1 = productCategoryList.slice(index + 1);
    setProductCategoryList(first1.concat(last1));
    if (first1.concat(last1).length == 0) {
      setProductCategory("전체");
    }
  }

  function filterSearchedData(
    searchedData: RevenueData[],
    sellers: string[],
    partnerNames: string[],
    productNames: string[],
    productCategories: string[]
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

      let isProductCategorySatisfied =
        productCategories.length > 0 ? false : true;

      if (!isProductCategorySatisfied) {
        const partnerProfile = allPartnerProfiles?.get(data.partnerName);
        if (!partnerProfile?.productCategory) {
          return false;
        }
        for (let i = 0; i < productCategories.length; i++) {
          if (partnerProfile?.productCategory.includes(productCategories[i])) {
            isProductCategorySatisfied = true;
            break;
          }
        }
      }

      return (
        isSellerSatisfied &&
        isPartnerNameSatisfied &&
        isProductNameSatisfied &&
        isProductCategorySatisfied
      );
    });
  }

  function fillBarGraphData(barGraphData: BarGraphData, data: RevenueData) {
    const salesKey = `${data.seller}_sales` as keyof BarGraphData;
    const salesAmount = getSalesAmount(data);

    (barGraphData[salesKey] as number) =
      ((barGraphData[salesKey] as number) ?? 0) + salesAmount;

    const proceedsKey = `${data.seller}_proceeds` as keyof BarGraphData;

    const proceeds = getProceedsFromItem(data);

    (barGraphData[proceedsKey] as number) =
      ((barGraphData[proceedsKey] as number) ?? 0) + proceeds;
    return true;
  }

  function getSalesTop5Products(
    data: RevenueData[]
  ): { productName: string; totalSales: number }[] {
    // 1. 상품명(productName)별로 price의 합을 계산하기 위해 Map을 사용
    const productSalesMap = new Map<string, number>();

    data.forEach((item) => {
      const exisitingSales = productSalesMap.get(item.productName) || 0;
      productSalesMap.set(
        item.productName,
        exisitingSales + getSalesAmount(item)
      );
    });

    // 2. Map을 배열로 변환하고, 총 price 기준으로 내림차순 정렬
    const sortedProducts = Array.from(productSalesMap.entries())
      .map(([productName, totalSales]) => ({ productName, totalSales }))
      .sort((a, b) => b.totalSales - a.totalSales);

    // 3. 상위 5개 상품을 반환
    return sortedProducts.slice(0, 5);
  }

  function getProceedsTop5Products(
    data: RevenueData[]
  ): { productName: string; totalProceeds: number }[] {
    // 1. 상품명(productName)별로 price의 합을 계산하기 위해 Map을 사용
    const productProceedsMap = new Map<string, number>();

    data.forEach((item) => {
      const existingProceeds = productProceedsMap.get(item.productName) || 0;

      productProceedsMap.set(
        item.productName,
        existingProceeds + getProceedsFromItem(item)
      );
    });

    // 2. Map을 배열로 변환하고, 총 price 기준으로 내림차순 정렬
    const sortedProducts = Array.from(productProceedsMap.entries())
      .map(([productName, totalProceeds]) => ({ productName, totalProceeds }))
      .sort((a, b) => b.totalProceeds - a.totalProceeds);

    // 3. 상위 5개 상품을 반환
    return sortedProducts.slice(0, 5);
  }

  function getAmountTop5Products(
    data: RevenueData[]
  ): { productName: string; totalAmount: number }[] {
    // 1. 상품명(productName)별로 price의 합을 계산하기 위해 Map을 사용
    const productAmountMap = new Map<string, number>();

    data.forEach((item) => {
      const existingAmount = productAmountMap.get(item.productName) || 0;

      productAmountMap.set(item.productName, existingAmount + item.amount);
    });

    // 2. Map을 배열로 변환하고, 총 price 기준으로 내림차순 정렬
    const sortedProducts = Array.from(productAmountMap.entries())
      .map(([productName, totalAmount]) => ({ productName, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 3. 상위 5개 상품을 반환
    return sortedProducts.slice(0, 5);
  }

  function getProceedsFromItem(item: RevenueData) {
    const partnerProfile = allPartnerProfiles?.get(item.partnerName);

    if (!partnerProfile) {
      setNoticeModalStr(
        `해당 공급처 정보를 불러오는 데에 실패했습니다. ${item.partnerName}`
      );
      setIsNoticeModalOpened(true);
      return 0;
    }

    const sellerProfile = allSellerProfiles?.get(item.seller);

    const commonFeeRate = LofaSellers.includes(item.seller)
      ? partnerProfile.lofaFee
      : partnerProfile.otherFee;

    const platformFeeRate = sellerProfile ? sellerProfile.fee : 0;

    const proceeds = getProceeds(item, commonFeeRate, platformFeeRate);
    return proceeds;
  }

  function GraphComponent({
    chartType,
  }: {
    chartType:
      | "전체 매출/수익"
      | "매출 TOP 5"
      | "수익 TOP 5"
      | "구매수량 TOP 5";
  }) {
    switch (chartType) {
      case "전체 매출/수익":
        return barGraphInput ? (
          barGraphInput.sellers.length > 0 ? (
            <Suspense
              fallback={<EmptyChart text={"데이터를 불러오는 중..."} />}
            >
              <LazyStackedBarGraph
                graphInput={barGraphInput ?? { sellers: [], data: [] }}
              />
            </Suspense>
          ) : (
            <EmptyChart text={"주어진 조건을 만족하는 결과가 없습니다."} />
          )
        ) : (
          <EmptyChart
            text={
              "'조회하기' 버튼을 클릭한 후 해당 기간의 데이터 조회가 가능합니다."
            }
          />
        );
      case "매출 TOP 5":
        return salesTop5LineGraphInput ? (
          salesTop5LineGraphInput.data.length > 0 ? (
            <Suspense
              fallback={<EmptyChart text={"데이터를 불러오는 중..."} />}
            >
              <LazyLineGraph
                graphInput={salesTop5LineGraphInput ?? { data: [] }}
              />
            </Suspense>
          ) : (
            <EmptyChart text={"주어진 조건을 만족하는 결과가 없습니다."} />
          )
        ) : (
          <EmptyChart
            text={
              "'조회하기' 버튼을 클릭한 후 해당 기간의 데이터 조회가 가능합니다."
            }
          />
        );
      case "수익 TOP 5":
        return proceedsTop5LineGraphInput ? (
          proceedsTop5LineGraphInput.data.length > 0 ? (
            <Suspense
              fallback={<EmptyChart text={"데이터를 불러오는 중..."} />}
            >
              <LazyLineGraph
                graphInput={proceedsTop5LineGraphInput ?? { data: [] }}
              />
            </Suspense>
          ) : (
            <EmptyChart text={"주어진 조건을 만족하는 결과가 없습니다."} />
          )
        ) : (
          <EmptyChart
            text={
              "'조회하기' 버튼을 클릭한 후 해당 기간의 데이터 조회가 가능합니다."
            }
          />
        );
      case "구매수량 TOP 5":
        return amountTop5LineGraphInput ? (
          amountTop5LineGraphInput.data.length > 0 ? (
            <Suspense
              fallback={<EmptyChart text={"데이터를 불러오는 중..."} />}
            >
              <LazyLineGraph
                graphInput={amountTop5LineGraphInput ?? { data: [] }}
              />
            </Suspense>
          ) : (
            <EmptyChart text={"주어진 조건을 만족하는 결과가 없습니다."} />
          )
        ) : (
          <EmptyChart
            text={
              "'조회하기' 버튼을 클릭한 후 해당 기간의 데이터 조회가 가능합니다."
            }
          />
        );
    }
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
        <GraphComponent chartType={graphType} />

        <Space w={20} />
        <div style={{}}>
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <CommonButton
              styleOverrides={{
                fontSize: "12px",
                marginRight: "6px",
                color: graphType == "전체 매출/수익" ? "white" : "black",
                backgroundColor:
                  graphType == "전체 매출/수익" ? "black" : "white",
              }}
              onClick={() => setChartType("전체 매출/수익")}
            >
              전체 매출/수익
            </CommonButton>
            <CommonButton
              styleOverrides={{
                fontSize: "12px",
                marginRight: "6px",
                color: graphType == "매출 TOP 5" ? "white" : "black",
                backgroundColor: graphType == "매출 TOP 5" ? "black" : "white",
              }}
              onClick={() => setChartType("매출 TOP 5")}
            >
              매출 TOP 5
            </CommonButton>
            <CommonButton
              styleOverrides={{
                fontSize: "12px",
                marginRight: "6px",
                color: graphType == "수익 TOP 5" ? "white" : "black",
                backgroundColor: graphType == "수익 TOP 5" ? "black" : "white",
              }}
              onClick={() => setChartType("수익 TOP 5")}
            >
              수익 TOP 5
            </CommonButton>
            <CommonButton
              styleOverrides={{
                fontSize: "12px",
                marginRight: "6px",
                color: graphType == "구매수량 TOP 5" ? "white" : "black",
                backgroundColor:
                  graphType == "구매수량 TOP 5" ? "black" : "white",
              }}
              onClick={() => setChartType("구매수량 TOP 5")}
            >
              구매수량 TOP 5
            </CommonButton>
          </div>
          <Space h={20} />
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
                  if (seller != "all") {
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

          {graphType == "전체 매출/수익" ? (
            <>
              <Space h={20} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "40px",
                }}
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
                    allPartnerProfiles
                      ? ["전체", ...Array.from(allPartnerProfiles.keys())]
                      : []
                  }
                  width="400px"
                />
              </div>
              <Space h={10} />
              <div
                style={{ display: "flex", flexWrap: "wrap", maxWidth: "400px" }}
              >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "40px",
                }}
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
                    searchedProductNames
                      ? ["전체", ...searchedProductNames]
                      : []
                  }
                  width="400px"
                />
              </div>
              <Space h={10} />
              <div
                style={{ display: "flex", flexWrap: "wrap", maxWidth: "400px" }}
              >
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
            </>
          ) : (
            <></>
          )}

          <Space h={20} />
          <div
            style={{ display: "flex", alignItems: "center", height: "40px" }}
          >
            <div>상품분류</div>
            <Space w={10} />
            <CommonSelect
              selected={productCategory}
              setSelected={(productCategory: string) => {
                setProductCategory(productCategory);
                if (productCategory == "전체") {
                  setProductCategoryList([]);
                  return;
                }
                if (!productCategoryList.includes(productCategory)) {
                  addProductCategory(productCategory);
                }
              }}
              items={
                allProductCategories ? ["전체", ...allProductCategories] : []
              }
            />
          </div>
          <Space h={10} />
          {productCategoryList.map((val, index) => (
            <ProductCategoryItem
              item={val}
              key={`ProductCategoryItem_${val}_${index}`}
              onDeleteClick={() => deleteProductCategory(index)}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
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

const LazyStackedBarGraph = React.lazy(() =>
  import("~/components/graph").then((module) => ({
    default: module.StackedBarGraph,
  }))
);

const LazyLineGraph = React.lazy(() =>
  import("~/components/graph").then((module) => ({
    default: module.LineGraph,
  }))
);
