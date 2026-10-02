"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const BRAND = "#0f766e";
const PIE_COLORS = ["#0f766e", "#2dd4bf", "#f59e0b", "#60a5fa", "#a78bfa"];

export function RevenueTrendChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
        />
        <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RpmTrendChart({ data }: { data: { month: string; rpm: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(v: unknown) => [`$${Number(v).toFixed(2)}/mi`, "Rate per mile"]}
        />
        <Line type="monotone" dataKey="rpm" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LoadsByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="status" stroke="var(--muted)" fontSize={11} />
        <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }} />
        <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TruckStatusPie({ data }: { data: { status: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-muted">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={45} outerRadius={70} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PaymentStatusPie({ data }: { data: { status: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-muted">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={45} outerRadius={70} paddingAngle={2}>
          <Cell fill="#f59e0b" />
          <Cell fill="#16a34a" />
        </Pie>
        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({ data, dataKey }: { data: Record<string, unknown>[]; dataKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis dataKey="label" stroke="var(--muted)" fontSize={11} />
        <YAxis stroke="var(--muted)" fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={BRAND} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
