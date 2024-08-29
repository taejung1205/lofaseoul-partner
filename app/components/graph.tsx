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
  LineChart,
  Line,
  LegendProps,
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

export type BarGraphData = {
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

export type BarGraphInput = {
  sellers: string[]; // 사용할 판매처들
  data: BarGraphData[];
};

export type LineGraphData = {
  name: string; //날짜 XXXX-XX-XX
  productName: string;
  value: number;
};

export type LineGraphInput = {
  unit?: string;
  data: LineGraphData[];
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

export function StackedBarGraph({ graphInput }: { graphInput: BarGraphInput }) {
  // Create a legend for each store

  const legendItems = Object.keys(COLORS)
    .filter((seller) => graphInput.sellers.includes(seller))
    .map((seller) => ({
      value: seller,
      color: COLORS[seller],
    }));

  return (
    <BarChart
      width={1000}
      height={500}
      data={graphInput.data}
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
            fontSize={16}
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
        fontSize={12}
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
              {graphInput.sellers.map((seller) => {
                if (!payload || !payload.length) return null;

                const sales = payload.find(
                  (item) => item.dataKey === `${seller}_sales`
                )?.value;
                const proceeds = payload.find(
                  (item) => item.dataKey === `${seller}_proceeds`
                )?.value;
                return (
                  <>
                    <div style={{ display: "flex", textAlign: "left" }}>
                      <div style={{ width: "160px" }}>{`${seller} 매출: `}</div>
                      <div>{`${
                        sales?.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }) ?? 0
                      }원`}</div>
                    </div>
                    <Space h={5} />
                    <div style={{ display: "flex", textAlign: "left" }}>
                      <div style={{ width: "160px" }}>{`${seller} 수익: `}</div>
                      <div>{`${
                        proceeds?.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }) ?? 0
                      }원`}</div>
                    </div>
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
      {graphInput.sellers.map((val, index) => {
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

export function LineGraph({ graphInput }: { graphInput: LineGraphInput }) {
  // Line에 사용될 색상들 (최대 5개)
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];

  // 상품별로 데이터를 그룹화
  const productNames = Array.from(
    new Set(graphInput.data.map((item) => item.productName))
  );

  const formattedData = productNames.reduce((acc, productName) => {
    const productData = graphInput.data.filter(
      (item) => item.productName === productName
    );

    productData.forEach(({ name, value }) => {
      const existingEntry = acc.find((entry) => entry.name === name);

      if (existingEntry) {
        existingEntry[productName] = value;
      } else {
        acc.push({ name, [productName]: value });
      }
    });

    return acc;
  }, [] as Record<string, any>[]);

  return (
    <LineChart
      width={1000}
      height={700}
      data={formattedData}
      margin={{
        top: 5,
        right: 30,
        left: 50,
        bottom: 100,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        padding={{ left: 50, right: 50 }}
        tick={({ x, y, payload }) => (
          <text
            x={x}
            y={y + 20} // y 좌표를 조정하여 레이블을 아래로 이동
            textAnchor="middle"
            fill="#666"
            fontSize={16}
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
        fontSize={12}
      />
      <Tooltip
        content={({ payload, label }: any) => {
          if (payload && payload.length) {
            return (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                <p>{label}</p>
                {payload.map((entry: any, index: number) => (
                  <div
                    style={{
                      display: "flex",
                      textAlign: "left",
                      lineHeight: "30px",
                    }}
                  >
                    <div style={{ width: "600px" }}>{`${entry.name}: `}</div>
                    <div>{`${
                      entry.value?.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }) ?? 0
                    }${graphInput.unit ?? "원"}`}</div>
                  </div>
                ))}
              </div>
            );
          }
          return null;
        }}
      />
      <Legend
        content={<CustomLegend />}
        verticalAlign="bottom"
        align="center"
        wrapperStyle={{ paddingTop: "30px", paddingLeft: "50px" }}
      />
      {productNames.map((productName, index) => (
        <Line
          key={productName}
          type="linear"
          dataKey={productName}
          stroke={COLORS[index % COLORS.length]}
          isAnimationActive={false}
        />
      ))}
    </LineChart>
  );
}

// CustomLegend Component
const CustomLegend: React.FC<LegendProps> = (props) => {
  const { payload } = props;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}
    >
      {payload?.map((entry, index) => (
        <div
          key={`item-${index}`}
          style={{
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: entry.color,
              marginRight: "10px",
            }}
          />
          <span style={{ fontSize: "14px" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};
