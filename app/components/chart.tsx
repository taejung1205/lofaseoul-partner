import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type StackedBarChartData = {
  name: string;
  a: number;
  b: number;
  c: number;
};

const data = [
  { name: "Page A", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Page B", uv: 3000, pv: 1398, amt: 2210 },
  // ...
];

// const MyComponent = React.lazy(() => import("./MyComponent"));

export const MyStackedBarChart = ({
  data,
}: {
  data: StackedBarChartData[];
}) => (
  <BarChart
    id="test"
    width={500}
    height={300}
    data={data}
    margin={{
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="a" stackId="a" fill="#8884d8" isAnimationActive={false} />
    <Bar dataKey="b" stackId="a" fill="#82ca9d" isAnimationActive={false} />
    <Bar dataKey="c" stackId="a" fill="blue" isAnimationActive={false} />
  </BarChart>
);
