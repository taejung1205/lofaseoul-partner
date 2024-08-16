import { LoadingOverlay, Space } from "@mantine/core";
import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { CommonButton } from "~/components/button";
import { DaySelectPopover } from "~/components/date";
import { PageLayout } from "~/components/page_layout";
import {
  PartnerRevenueStat,
  PartnerRevenueStatTableMemo,
} from "~/components/revenue_stat";
import { getRevenueStats } from "~/services/firebase.server";
import { dateToDayStr, dayStrToDate, getTimezoneDate } from "~/utils/date";
import dayPickerStyles from "react-day-picker/dist/style.css";

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

    const startDate = new Date(`${startDateStr}T00:00:00Z`);
    const endDate = new Date(`${endDateStr}T23:59:59Z`);

    const searchResult = await getRevenueStats({
      startDate: startDate,
      endDate: endDate,
    });

    return json({
      status: "ok",
      data: searchResult,
      message: `${searchResult.length}사의 수익통계를 조회하였습니다.`,
      startDate: startDateStr,
      endDate: endDateStr,
    });
  } else {
    return json({
      status: "ok",
      message: "",
    });
  }
};

export default function Page() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();

  //검색조건
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

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

  const statItems: PartnerRevenueStat[] = useMemo(() => {
    if (!loaderData || !loaderData.data) {
      return null;
    } else {
      return loaderData.data;
    }
  }, [loaderData]);

  //날짜 정보 적용
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

  return (
    <PageLayout>
      <LoadingOverlay
        visible={
          navigation.state == "loading" || navigation.state == "submitting"
        }
        overlayBlur={2}
      />
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/images/icon_calendar.svg" />
        <Space w={10} />
        <DaySelectPopover
          selectedDate={startDate}
          setSelectedDate={setStartDate}
        />
        <Space w={5} />
        <div>~</div>
        <Space w={5} />
        <DaySelectPopover selectedDate={endDate} setSelectedDate={setEndDate} />
        <Space w={20} />
        <Link
          to={`/admin/revenue-calculate?is-searched=true&start-date=${
            startDate ? dateToDayStr(startDate) : ""
          }&end-date=${endDate ? dateToDayStr(endDate) : ""}`}
        >
          <CommonButton>조회하기</CommonButton>
        </Link>
        <Space w={20} />
        {statItems == null || statItems.length == 0 ? (
          <></>
        ) : (
          <CommonButton
            width={180}
            onClick={async () => {
              // await writeExcel(statItems);
            }}
          >
            엑셀 다운로드
          </CommonButton>
        )}
      </div>
      <Space h={20} />
      {statItems ? (
        <PartnerRevenueStatTableMemo
          items={statItems}
          checkboxRequired={false}
        />
      ) : (
        <></>
      )}
    </PageLayout>
  );
}
