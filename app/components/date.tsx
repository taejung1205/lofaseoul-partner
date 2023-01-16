import { Popover } from "@mantine/core";
import styled from "styled-components";

export function monthToKorean(date: Date) {
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}년 ${month}월`;
}

export function monthToNumeral(date: Date) {
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
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
