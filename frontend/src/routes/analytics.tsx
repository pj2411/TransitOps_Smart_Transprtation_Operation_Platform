import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTrips, getFuelLogs, getExpenses, getVehicles, getMaintenanceLogs } from "@/lib/store";
import type { Trip, FuelLog, Expense, Vehicle, MaintenanceLog } from "@/types";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const chartTooltip = {
  contentStyle: { background: "#1c2228", border: "1px solid #232a31", borderRadius: 8 },
  labelStyle: { color: "#e9ecef" },
};

const pieColors = ["#1971c2", "#2f9e44", "#f08c00", "#e03131"];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border bg-panel p-5 print:break-inside-avoid">
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      fuelEfficiency: "0 km/L",
      utilization: "0%",
      opsCost: "₹0",
      avgRoi: "0%"
    },
    charts: {
      roiPerVehicle: [] as any[],
      fuelEfficiencyTrend: [] as any[],
      costVsRevenue: [] as any[],
      costBreakdown: [] as any[]
    },
    raw: {
      trips: [] as Trip[],
      fuel: [] as FuelLog[],
      exp: [] as Expense[],
      maint: [] as MaintenanceLog[],
      vehicles: [] as Vehicle[]
    }
  });

  const loadData = async () => {
    try {
      const [trips, fuel, exp, maint, vehicles] = await Promise.all([
        getTrips(), getFuelLogs(), getExpenses(), getMaintenanceLogs(), getVehicles()
      ]);

      // --- KPI: Fuel Efficiency ---
      const totalDistance = trips.reduce((sum, t) => sum + (t.status === 'Completed' && t.finalOdometer ? t.plannedDistance : 0), 0);
      const totalLiters = fuel.reduce((sum, f) => sum + f.liters, 0);
      const fuelEff = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(1) : "0";

      // --- KPI: Utilization ---
      const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
      const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

      // --- KPI: Ops Cost ---
      const fuelCost = fuel.reduce((sum, f) => sum + f.cost, 0);
      const expCost = exp.reduce((sum, e) => sum + e.toll + e.other, 0);
      const maintCost = maint.reduce((sum, m) => sum + m.cost, 0);
      const opsCost = fuelCost + expCost + maintCost;

      // --- ROI Calculation per Vehicle ---
      let totalRoiPct = 0;
      let validRoiCount = 0;
      const roiData = vehicles.map(v => {
        const vTrips = trips.filter(t => t.vehicleId === v.id);
        const vFuel = fuel.filter(f => f.vehicleId === v.id).reduce((s, x) => s + x.cost, 0);
        const vExp = exp.filter(e => e.vehicleId === v.id).reduce((s, x) => s + x.toll + x.other, 0);
        const vMaint = maint.filter(m => m.vehicleId === v.id).reduce((s, x) => s + x.cost, 0);
        
        const rev = vTrips.reduce((s, x) => s + x.revenue, 0);
        const cost = vFuel + vExp + vMaint;
        const roi = v.acquisitionCost > 0 ? ((rev - cost) / v.acquisitionCost) * 100 : 0;
        
        if (v.acquisitionCost > 0) {
          totalRoiPct += roi;
          validRoiCount++;
        }
        
        return { vehicle: v.regNumber, roi: Math.round(roi * 10) / 10 };
      }).sort((a,b) => b.roi - a.roi).slice(0, 10); 
      
      const avgRoi = validRoiCount > 0 ? (totalRoiPct / validRoiCount).toFixed(1) : "0";

      // --- Cost vs Revenue (Monthly) ---
      const monthlyData: Record<string, { month: string, cost: number, revenue: number }> = {};
      const addMonth = (dateStr: string, cost: number, rev: number) => {
        if (!dateStr) return;
        const month = dateStr.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { month, cost: 0, revenue: 0 };
        monthlyData[month].cost += cost;
        monthlyData[month].revenue += rev;
      };

      trips.forEach(t => addMonth(t.createdAt, 0, t.revenue));
      fuel.forEach(f => addMonth(f.date, f.cost, 0));
      exp.forEach(e => addMonth(e.date, e.toll + e.other, 0));
      maint.forEach(m => addMonth(m.dateOpened, m.cost, 0));

      const costVsRevenue = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-7).map(d => ({
        ...d, month: new Date(d.month + '-01').toLocaleString('default', { month: 'short' })
      }));

      // --- Fuel Efficiency Trend ---
      const monthlyEff: Record<string, { dist: number, lit: number }> = {};
      fuel.forEach(f => {
        const m = f.date.substring(0, 7);
        if (!monthlyEff[m]) monthlyEff[m] = { dist: 0, lit: 0 };
        monthlyEff[m].lit += f.liters;
      });
      trips.forEach(t => {
        const m = t.createdAt.substring(0, 7);
        if (!monthlyEff[m]) monthlyEff[m] = { dist: 0, lit: 0 };
        monthlyEff[m].dist += t.plannedDistance;
      });
      const fuelEfficiencyTrend = Object.keys(monthlyEff).sort().slice(-7).map(k => ({
        month: new Date(k + '-01').toLocaleString('default', { month: 'short' }),
        kml: monthlyEff[k].lit > 0 ? Math.round((monthlyEff[k].dist / monthlyEff[k].lit) * 10) / 10 : 0
      }));

      // --- Cost Breakdown ---
      const costBreakdown = [
        { name: "Fuel", value: fuelCost },
        { name: "Maintenance", value: maintCost },
        { name: "Tolls/Misc", value: expCost }
      ].filter(x => x.value > 0);

      setData({
        kpis: {
          fuelEfficiency: `${fuelEff} km/L`,
          utilization: `${utilization}%`,
          opsCost: `₹${opsCost.toLocaleString()}`,
          avgRoi: `${avgRoi}%`
        },
        charts: { roiPerVehicle: roiData, fuelEfficiencyTrend, costVsRevenue, costBreakdown },
        raw: { trips, fuel, exp, maint, vehicles }
      });
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const exportCSV = () => {
    const { trips, fuel, maint, exp } = data.raw;
    let csv = "Type,ID,Date,VehicleID,Value1,Value2,Cost,Revenue\n";
    
    trips.forEach(t => csv += `Trip,${t.id},${t.createdAt.split('T')[0]},${t.vehicleId},${t.source},${t.destination},0,${t.revenue}\n`);
    fuel.forEach(f => csv += `Fuel,${f.id},${f.date},${f.vehicleId},${f.liters}L,-,${f.cost},0\n`);
    maint.forEach(m => csv += `Maintenance,${m.id},${m.dateOpened},${m.vehicleId},${m.serviceType},-,${m.cost},0\n`);
    exp.forEach(e => csv += `Expense,${e.id},${e.date},${e.vehicleId},Toll:${e.toll},Other:${e.other},${e.toll + e.other},0\n`);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transitops_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Aggregating real-time data...</div>;

  return (
    <>
      <div className="print:hidden">
        <PageHeader 
          title="Analytics" 
          subtitle="ROI, efficiency and cost visibility across your fleet." 
          actions={
            <>
              <Button size="sm" variant="outline" className="border-border bg-canvas" onClick={exportCSV}>
                <FileText className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button size="sm" onClick={exportPDF} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </>
          }
        />
      </div>

      <div className="print:block hidden mb-4">
        <h1 className="text-2xl font-bold">TransitOps Executive Report</h1>
        <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { k: "Fuel Efficiency", v: data.kpis.fuelEfficiency, tone: "text-success" },
          { k: "Fleet Utilization", v: data.kpis.utilization, tone: "text-info" },
          { k: "Operational Cost", v: data.kpis.opsCost, tone: "text-warning" },
          { k: "Vehicle ROI (avg)", v: data.kpis.avgRoi, tone: "text-success" },
        ].map((k) => (
          <Card key={k.k} className="border-border bg-panel p-5 print:break-inside-avoid">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.k}</div>
            <div className={`mt-2 text-2xl font-semibold ${k.tone}`}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="ROI per Vehicle" subtitle="Percentage return on operational cost">
          <BarChart data={data.charts.roiPerVehicle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
            <XAxis dataKey="vehicle" stroke="#adb5bd" fontSize={11} />
            <YAxis stroke="#adb5bd" fontSize={12} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
              {data.charts.roiPerVehicle.map((r, i) => (
                <Cell key={i} fill={r.roi >= 0 ? "#2f9e44" : "#e03131"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Fuel Efficiency Trend" subtitle="Fleet-wide km per litre">
          <AreaChart data={data.charts.fuelEfficiencyTrend}>
            <defs>
              <linearGradient id="eff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1971c2" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#1971c2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
            <XAxis dataKey="month" stroke="#adb5bd" fontSize={12} />
            <YAxis stroke="#adb5bd" fontSize={12} domain={[0, 'dataMax + 2']} />
            <Tooltip {...chartTooltip} />
            <Area type="monotone" dataKey="kml" stroke="#1971c2" strokeWidth={2} fill="url(#eff)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Cost vs Revenue" subtitle="Rolling 7-month view">
          <LineChart data={data.charts.costVsRevenue}>
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
            <Pie data={data.charts.costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {data.charts.costBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: "#adb5bd" }} />
          </PieChart>
        </ChartCard>
      </div>
    </>
  );
}
