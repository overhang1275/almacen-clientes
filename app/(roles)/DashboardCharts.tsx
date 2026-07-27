"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Datum = Record<string, string | number>;

const colors = ["#2563eb", "#16a34a", "#f97316", "#eab308", "#ef4444", "#7c3aed"];

export function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div aria-label={title} className="mt-4 h-72" role="img">
        {children}
      </div>
    </section>
  );
}

export function Bars({ bars, data, xKey }: { bars: { key: string; label: string; color?: string }[]; data: Datum[]; xKey: string }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {bars.map((bar, index) => (
          <Bar dataKey={bar.key} fill={bar.color ?? colors[index % colors.length]} key={bar.key} name={bar.label} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Lines({ data, lines, xKey }: { data: Datum[]; lines: { key: string; label: string; color?: string }[]; xKey: string }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {lines.map((line, index) => (
          <Line dataKey={line.key} key={line.key} name={line.label} stroke={line.color ?? colors[index % colors.length]} strokeWidth={2} type="monotone" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieDonut({ data, nameKey, valueKey }: { data: Datum[]; nameKey: string; valueKey: string }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie data={data} dataKey={valueKey} innerRadius={56} nameKey={nameKey} outerRadius={96} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell fill={colors[index % colors.length]} key={`${entry[nameKey]}-${index}`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
