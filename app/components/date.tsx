import { Popover } from "@mantine/core";
import { DayPicker } from "react-day-picker";
import styled from "styled-components";

import dayPickerStyles from "react-day-picker/dist/style.css";

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export function getTimezoneDate(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() / 60;
  return new Date(date.getTime() + (timezoneOffset + 9) * 3600 * 1000);
}

export function dateToKoreanMonth(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear().toString().substring(2);
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  return `${year}년 ${month}월`;
}

export function dateToNumeralMonth(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear().toString().substring(2);
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
}

export function numeralMonthToKorean(numeral: string) {
  const year = numeral.substring(0, 2);
  const month = numeral.substring(2);
  return `${year}년 ${month}월`;
}

export function koreanMonthToNumeral(monthStr: string) {
  const year = monthStr.substring(0, 2);
  const month = monthStr.substring(4, 6);
  return `${year}${month}`;
}

export function koreanMonthToDate(monthStr: string) {
  const year = monthStr.substring(0, 2);
  const month = monthStr.substring(4, 6);
  return new Date(2000 + Number(year), Number(month) - 1);
}

export function dateToDayStr(date: Date) {
  const newDate = getTimezoneDate(date);
  const year = newDate.getFullYear();
  const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
  const day = newDate.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayStrToDate(dayStr: string) {
  const year = dayStr.substring(0, 4);
  const month = dayStr.substring(5, 7);
  const day = dayStr.substring(8, 10);
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function MonthSelectPopover({
  onLeftClick,
  onRightClick,
  monthStr,
}: {
  onLeftClick: () => void;
  onRightClick: () => void;
  monthStr: string;
}) {
  return (
    <Popover>
      <Popover.Target>
        <MonthBox>{monthStr}</MonthBox>
      </Popover.Target>
      <Popover.Dropdown>
        <div style={{ display: "flex", fontSize: "20px", fontWeight: "700" }}>
          <div onClick={onLeftClick} style={{ cursor: "pointer" }}>{`<`}</div>
          <div style={{ width: "20px" }} />
          {monthStr}
          <div style={{ width: "20px" }} />
          <div onClick={onRightClick} style={{ cursor: "pointer" }}>{`>`}</div>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}

export function DaySelectPopover({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <Popover.Target>
        <MonthBox>
          {selectedDate !== undefined ? dateToDayStr(selectedDate) : ""}
        </MonthBox>
      </Popover.Target>
      <Popover.Dropdown>
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          styles={{
            day: {
              fontSize: "16px",
            },
          }}
          modifiersStyles={{
            selected: {
              backgroundColor: "grey",
            },
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

const MonthBox = styled.div`
  border: 3px solid #000000;
  width: 140px;
  font-size: 20px;
  line-height: 20px;
  padding: 6px;
  height: 40px;
  text-align: center;
  align-items: center;
  margin-left: 20px;
  cursor: pointer;
`;
