import { PageLayout } from "~/components/page_layout";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "@remix-run/react";
import {
  dateToDayStr,
  DaySelectPopover,
  dayStrToDate,
} from "~/components/date";
import { GetListButton } from "~/components/button";
import { json, LoaderFunction } from "@remix-run/node";

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");
  
    if (day !== null) {
      //   const monthStr = numeralMonthToKorean(month);
      //   const sums = await getAllSettlementSum({
      //     monthStr: monthStr,
      //   });
      //   console.log(sums);
      return json({ day: day });
    } else {
      return null;
    }
  };

export default function AdminOrderList() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const loaderData = useLoaderData();

  const selectedDayStr = useMemo(
    () => dateToDayStr(selectedDate ?? new Date()),
    [selectedDate]
  );

  //날짜 수신
  useEffect(() => {
    if (loaderData == null) {
      setSelectedDate(new Date());
    } else {
      setSelectedDate(dayStrToDate(loaderData.day));
    }
  }, []);

  return (
    <>
      <PageLayout>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/icon_calendar.svg" />
          <DaySelectPopover
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          <Link to={`/admin/order-share?day=${selectedDayStr}`}>
            <GetListButton>조회하기</GetListButton>
          </Link>
        </div>
      </PageLayout>
    </>
  );
}
