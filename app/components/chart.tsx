import { Space } from "@mantine/core";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

export const PossibleSellers = [
  "29cm",
  "EQL",
  "로파공홈",
  "용산쇼룸",
  "예약거래",
  "오늘의집",
  "카카오",
  "무신사",
];

export type BarChartData = {
  name: string; // 날짜
  "29cm_sales"?: number;
  "29cm_proceeds"?: number;
  EQL_sales: number;
  EQL_proceeds: number;
  로파공홈_sales: number;
  로파공홈_proceeds: number;
  용산쇼룸_sales: number;
  용산쇼룸_proceeds: number;
  예약거래_sales: number;
  예약거래_proceeds: number;
  오늘의집_sales: number;
  오늘의집_proceeds: number;
  카카오_sales: number;
  카카오_proceeds: number;
  무신사_sales: number;
  무신사_proceeds: number;
};

export type BarChartInput = {
  sellers: string[]; // 사용할 판매처들
  data: BarChartData[];
};

// 판매처별 색상 설정
const COLORS: Record<string, string> = {
  ["로파공홈"]: "#8884d8",
  ["29cm"]: "#82ca9d",
  ["EQL"]: "#d0ed57",
  ["용산쇼룸"]: "#ff8042",
  ["예약거래"]: "#8dd1e1",
  ["카카오"]: "#ffc658",
  ["무신사"]: "#a4de6c",
  ["오늘의집"]: "#8a2be2",
  // 다른 판매처 색상 추가 가능
};

// const MyComponent = React.lazy(() => import("./MyComponent"));

export function MyStackedBarChart({ chartData }: { chartData: BarChartInput }) {
  // Create a legend for each store

  const legendItems = Object.keys(COLORS)
    .filter((seller) => chartData.sellers.includes(seller))
    .map((seller) => ({
      value: seller,
      color: COLORS[seller],
    }));

  return (
    <BarChart
      id="test"
      width={1000}
      height={500}
      data={chartData.data}
      margin={{
        top: 5,
        right: 30,
        left: 50,
        bottom: 40,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        tick={({ x, y, payload }) => (
          <text
            x={x}
            y={y + 40} // y 좌표를 조정하여 레이블을 아래로 이동
            textAnchor="middle"
            fill="#666"
            fontSize={20}
          >
            {payload.value}
          </text>
        )}
      />
      <YAxis
        tickFormatter={(tick: number | string) => {
          const value = typeof tick === "string" ? parseInt(tick, 10) : tick;
         
            return value.toLocaleString(); 
        }}
      />
      <Tooltip
        content={({ payload, label }) => {
          return (
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              <p>{label}</p>
              {chartData.sellers.map((seller) => {
                if (!payload || !payload.length) return null;

                const sales = payload.find(
                  (item) => item.dataKey === `${seller}_sales`
                )?.value;
                const proceeds = payload.find(
                  (item) => item.dataKey === `${seller}_proceeds`
                )?.value;
                return (
                  <>
                    <div>{`${seller} 매출: ${sales ?? 0}`}</div>
                    <Space h={5} />
                    <div>{`${seller} 수익: ${proceeds ?? 0}`}</div>
                    <Space h={15} />
                  </>
                );
              })}
            </div>
          );
        }}
      />
      <Legend
        wrapperStyle={{
          bottom: 0,
          left: "center",
          marginBottom: 0,
        }}
        payload={legendItems.map((item) => ({
          value: item.value,
          type: "square",
          color: item.color,
        }))}
      />
      {chartData.sellers.map((val, index) => {
        return (
          <>
            <Bar
              dataKey={`${val}_sales`}
              stackId={0}
              fill={COLORS[val]}
              isAnimationActive={false}
              name={val}
            >
              {index == 0 ? (
                <LabelList
                  dataKey={`${val}_sales`}
                  name="매출"
                  position={"bottom"}
                  fontSize={12}
                  formatter={() => `매출`}
                />
              ) : (
                <></>
              )}
            </Bar>
            <Bar
              dataKey={`${val}_proceeds`}
              stackId={1}
              fill={COLORS[val]}
              isAnimationActive={false}
              name={val}
            >
              {index == 0 ? (
                <LabelList
                  dataKey={`${val}_sales`}
                  name="수익"
                  position={"bottom"}
                  fontSize={12}
                  formatter={() => `수익`}
                />
              ) : (
                <></>
              )}
            </Bar>
          </>
        );
      })}
    </BarChart>
  );
}
