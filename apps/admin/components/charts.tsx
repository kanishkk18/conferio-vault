"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ef4444", "#06b6d4", "#a855f7"];

export function SignupsChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232732" />
        <XAxis dataKey="date" stroke="#8b90a0" fontSize={11} tickLine={false} />
        <YAxis stroke="#8b90a0" fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#12151c", border: "1px solid #232732", borderRadius: 8 }}
        />
        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FileTypeChart({ data }: { data: Array<{ fileType: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232732" />
        <XAxis dataKey="fileType" stroke="#8b90a0" fontSize={11} tickLine={false} />
        <YAxis stroke="#8b90a0" fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#12151c", border: "1px solid #232732", borderRadius: 8 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
