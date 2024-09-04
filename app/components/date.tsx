import { Popover } from "@mantine/core";
import { endOfWeek, startOfWeek } from "date-fns";
import { forwardRef } from "react";
import { DayPicker } from "react-day-picker";

import dayPickerStyles from "react-day-picker/dist/style.css";
import { dateToDayStr } from "~/utils/date";

export function links() {
  return [{ rel: "stylesheet", href: dayPickerStyles }];
}

export function getIdFromTime() {
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  const second = date.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
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
        <DateTargetBox>{monthStr}</DateTargetBox>
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
        <DateTargetBox>
          {selectedDate !== undefined ? dateToDayStr(selectedDate) : ""}
        </DateTargetBox>
      </Popover.Target>
      <Popover.Dropdown style={{ minWidth: "300px" }}>
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          styles={{
            day: {
              fontSize: "16px",
            },
            caption: {
              display: "flex",
              justifyContent: "space-betwen",
              alignItems: "center",
              width: "280px",
            },
            caption_label: {
              fontSize: "20px",
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

export function WeekSelectPopover({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <Popover.Target>
        <WeekTargetBox>
          {selectedDate !== undefined
            ? `${dateToDayStr(startOfWeek(selectedDate))} ~ ${dateToDayStr(
                endOfWeek(selectedDate)
              )}`
            : ""}
        </WeekTargetBox>
      </Popover.Target>
      <Popover.Dropdown>
        <DayPicker
          selected={
            selectedDate
              ? { from: startOfWeek(selectedDate), to: endOfWeek(selectedDate) }
              : undefined
          }
          onDayClick={(day) => {
            setSelectedDate(startOfWeek(day));
          }}
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

const DateTargetBox = forwardRef((props: any, ref: React.ForwardedRef<any>) => (
  <div
    ref={ref}
    style={{
      border: "3px solid #000000",
      width: "140px",
      minWidth: "140px",
      fontSize: "20px",
      lineHeight: "20px",
      padding: "6px",
      height: "40px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
    }}
    {...props}
  >
    {props.children}
  </div>
));

const WeekTargetBox = forwardRef((props: any, ref: React.ForwardedRef<any>) => (
  <div
    ref={ref}
    style={{
      border: "3px solid #000000",
      width: "280px",
      minWidth: "280px",
      fontSize: "20px",
      lineHeight: "20px",
      padding: "6px",
      height: "40px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
    }}
    {...props}
  >
    {props.children}
  </div>
));
