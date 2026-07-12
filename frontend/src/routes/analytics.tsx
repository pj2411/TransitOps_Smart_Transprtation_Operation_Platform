import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { costBreakdown, fuelEfficiency, monthlyFinancials, roiPerVehicle } from "@/lib/mock-data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const chartTooltip = {
  contentStyle: { background: "#1c2228", border: "1px solid #232a31", borderRadius: 8 },
  labelStyle: { color: "#e9ecef" },
};

const pieColors = ["#1971c2", "#2f9e44", "#f08c00", "#e03131"];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border bg-panel p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer>
      </div>
    </Card>
  );
}

function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="ROI, efficiency and cost visibility across your fleet." />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { k: "Fuel Efficiency", v: "8.4 km/L", tone: "text-success" },
          { k: "Fleet Utilization", v: "81%", tone: "text-info" },
          { k: "Operational Cost", v: "₹34,070", tone: "text-warning" },
          { k: "Vehicle ROI (avg)", v: "34.2%", tone: "text-success" },
        ].map((k) => (
          <Card key={k.k} className="border-border bg-panel p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.k}</div>
            <div className={`mt-2 text-2xl font-semibold ${k.tone}`}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="ROI per Vehicle" subtitle="Percentage return on operational cost">
          <BarChart data={roiPerVehicle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
            <XAxis dataKey="vehicle" stroke="#adb5bd" fontSize={11} />
            <YAxis stroke="#adb5bd" fontSize={12} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
              {roiPerVehicle.map((r) => (
                <Cell key={r.vehicle} fill={r.roi >= 0 ? "#2f9e44" : "#e03131"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Fuel Efficiency Trend" subtitle="Fleet-wide km per litre">
          <AreaChart data={fuelEfficiency}>
            <defs>
              <linearGradient id="eff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1971c2" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#1971c2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
            <XAxis dataKey="month" stroke="#adb5bd" fontSize={12} />
            <YAxis stroke="#adb5bd" fontSize={12} domain={[7, 9]} />
            <Tooltip {...chartTooltip} />
            <Area type="monotone" dataKey="kml" stroke="#1971c2" strokeWidth={2} fill="url(#eff)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Cost vs Revenue" subtitle="Rolling 7-month view">
          <LineChart data={monthlyFinancials}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
            <XAxis dataKey="month" stroke="#adb5bd" fontSize={12} />
            <YAxis stroke="#adb5bd" fontSize={12} />
            <Tooltip {...chartTooltip} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#adb5bd" }} />
            <Line type="monotone" dataKey="cost" stroke="#f08c00" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="revenue" stroke="#2f9e44" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Operational Cost Breakdown" subtitle="Share of total cost">
          <PieChart>
            <Tooltip {...chartTooltip} />
            <Pie data={costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {costBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: "#adb5bd" }} />
          </PieChart>
        </ChartCard>
      </div>
    </>
  );
}
