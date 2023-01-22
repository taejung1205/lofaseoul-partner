import { useEffect, useMemo, useState } from "react";
import { dateToDayStr, DaySelectPopover, dayStrToDate } from "~/components/date";

import dayPickerStyles from "react-day-picker/dist/style.css";
import styled from "styled-components";
import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

const SettlementSharePage = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  padding: 30px 40px 30px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

const FileNameBox = styled.div`
  border: 3px solid #000000;
  background-color: #efefef;
  width: 550px;
  max-width: 70%;
  font-size: 20px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 6px;
  text-align: left;
`;

const FileUploadButton = styled.label`
  background-color: white;
  border: 3px solid black;
  font-size: 20px;
  font-weight: 700;
  width: 110px;
  line-height: 24px;
  padding: 6px;
  cursor: pointer;
`;

const FileUpload = styled.input`
  width: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
`;

const ShareButton = styled.button`
  background-color: black;
  color: white;
  font-size: 24px;
  font-weight: 700;
  width: 350px;
  line-height: 1;
  padding: 6px 6px 6px 6px;
  cursor: pointer;
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

export default function AdminOrderShare() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const loaderData = useLoaderData();

  const selectedDayStr = useMemo(
    () => dateToDayStr(selectedDate ?? new Date()),
    [selectedDate]
  );

  //날짜 수신
  useEffect(() => {
    if(loaderData == null){
        setSelectedDate(new Date());
    } else {
        setSelectedDate(dayStrToDate(loaderData.day));
    }
    
  }, []);
  
  return (
    <>
      <SettlementSharePage>
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
      </SettlementSharePage>
    </>
  );
}
