import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVehicles, getFuelLogs, getExpenses, addFuelLog } from "@/lib/store";
import type { Vehicle, FuelLog, Expense } from "@/types";
import { Fuel, Plus, Receipt } from "lucide-react";

export const Route = createFileRoute("/fuel")({ component: FuelPage });

function FuelPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [exp, setExp] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: "", liters: 40, cost: 0 });

  const loadData = async () => {
    try {
      const [vs, fs, es] = await Promise.all([getVehicles(), getFuelLogs(), getExpenses()]);
      setVehicles(vs);
      setLogs(fs);
      setExp(es);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addFuel = async () => {
    if (!form.vehicleId) return;
    try {
      await addFuelLog({
        vehicleId: form.vehicleId,
        date: new Date().toISOString().split('T')[0],
        liters: form.liters,
        cost: form.cost
      });
      await loadData();
      setForm({ ...form, cost: 0 });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const totalOps = logs.reduce((s, l) => s + l.cost, 0) + exp.reduce((s, e) => s + (e.toll + e.other), 0);

  return (
    <>
      <PageHeader title="Fuel & Expense Management" subtitle="Fuel receipts, tolls and operational cost roll-up." />

      <Card className="mb-6 border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-warning" />
            <div className="text-sm font-semibold">Fuel Log</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-canvas px-3 py-1.5">
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger className="h-7 w-32 border-0 bg-transparent px-1 text-xs"><SelectValue placeholder="Vehicle..." /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: +e.target.value })} placeholder="L" className="h-7 w-16 border-0 bg-transparent px-1 text-xs" />
              <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} placeholder="₹" className="h-7 w-20 border-0 bg-transparent px-1 text-xs" />
            </div>
            <Button size="sm" onClick={addFuel} className="bg-warning text-warning-foreground hover:bg-warning/90 disabled:opacity-50" disabled={!form.vehicleId}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Log Fuel
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Vehicle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Liters</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => {
              const v = vehicles.find(x => x.id === l.vehicleId);
              return (
                <TableRow key={l.id} className="border-border hover:bg-canvas">
                  <TableCell className="font-medium">{v?.regNumber || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{l.liters} L</TableCell>
                  <TableCell className="text-right">₹{l.cost.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-info" />
            <div className="text-sm font-semibold">Other Expenses (Tolls / Misc)</div>
          </div>
          <Button size="sm" variant="outline" className="border-border bg-canvas">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Expense
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Toll</TableHead>
              <TableHead className="text-right">Other</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exp.map((e) => {
              const v = vehicles.find(x => x.id === e.vehicleId);
              return (
                <TableRow key={e.id} className="border-border hover:bg-canvas">
                  <TableCell className="font-medium">{v?.regNumber || 'Unknown'}</TableCell>
                  <TableCell className="text-right">₹{e.toll.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{e.other.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{(e.toll + e.other).toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="text-xs text-muted-foreground">Total operational cost (fuel + expenses)</div>
          <div className="text-lg font-semibold">₹{totalOps.toLocaleString()}</div>
        </div>
      </Card>
    </>
  );
}
