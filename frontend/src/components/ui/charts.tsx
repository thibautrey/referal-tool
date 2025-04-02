import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import React from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
  "#4C8BF5",
  "#9370DB",
];

type DataItem = Record<string, number | string>;

interface CommonChartProps {
  data: DataItem[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

interface LineChartProps extends CommonChartProps {
  index: string;
  categories: string[];
  colors?: string[];
  showLegend?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  index,
  categories,
  colors = COLORS,
  height = 300,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={height}
      className="line-chart-glassmorphism"
    >
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey={index}
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 12 }}
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={valueFormatter}
          labelFormatter={(value) => `${value}`}
        />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

interface BarChartProps extends CommonChartProps {
  index: string;
  categories: string[];
  colors?: string[];
  showLegend?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  colors = COLORS,
  height = 300,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey={index}
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 12 }}
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={valueFormatter}
          labelFormatter={(value) => `${value}`}
        />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

interface PieChartProps extends CommonChartProps {
  index: string;
  category: string;
  colors?: string[];
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  index,
  category,
  colors = COLORS,
  height = 300,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={category}
          nameKey={index}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={valueFormatter}
          labelFormatter={(value) => `${value}`}
        />
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
