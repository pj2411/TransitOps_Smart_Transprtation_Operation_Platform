import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVehicles, getFuelLogs, getExpenses, addFuelLog, updateFuelLog, addExpense, updateExpense } from "@/lib/store";
import type { Vehicle, FuelLog, Expense } from "@/types";
import { Fuel, Plus, Receipt, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/fuel")({ component: FuelPage });

function FuelPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [exp, setExp] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: "", liters: 40, cost: 0 });
  const [editTarget, setEditTarget] = useState<FuelLog | null>(null);
  const [page, setPage] = useState(1);
  const [expPage, setExpPage] = useState(1);
  const [isAddExp, setIsAddExp] = useState(false);
  const [editExpTarget, setEditExpTarget] = useState<Expense | null>(null);
  const pageSize = 10;

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
  
  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  const totalExpPages = Math.ceil(exp.length / pageSize);
  const paginatedExp = exp.slice((expPage - 1) * pageSize, expPage * pageSize);

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
              <TableHead className="w-[80px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((l) => {
              const v = vehicles.find(x => x.id === l.vehicleId);
              return (
                <TableRow key={l.id} className="border-border hover:bg-canvas">
                  <TableCell className="font-medium">{v?.regNumber || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{l.liters} L</TableCell>
                  <TableCell className="text-right">₹{l.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditTarget(l)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-panel hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, logs.length)} of {logs.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <div className="text-xs text-foreground">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-info" />
            <div className="text-sm font-semibold">Other Expenses (Tolls / Misc)</div>
          </div>
          <Button size="sm" variant="outline" className="border-border bg-canvas" onClick={() => setIsAddExp(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Expense
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Vehicle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Toll</TableHead>
              <TableHead className="text-right">Other</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="w-[80px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExp.map((e) => {
              const v = vehicles.find(x => x.id === e.vehicleId);
              return (
                <TableRow key={e.id} className="border-border hover:bg-canvas">
                  <TableCell className="font-medium">{v?.regNumber || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">₹{e.toll.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{e.other.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">₹{(e.toll + e.other).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditExpTarget(e)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-panel hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {totalExpPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {(expPage - 1) * pageSize + 1} to {Math.min(expPage * pageSize, exp.length)} of {exp.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setExpPage((p) => Math.max(1, p - 1))} disabled={expPage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <div className="text-xs text-foreground">Page {expPage} of {totalExpPages}</div>
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setExpPage((p) => Math.min(totalExpPages, p + 1))} disabled={expPage === totalExpPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="text-xs text-muted-foreground">Total operational cost (fuel + expenses)</div>
          <div className="text-lg font-semibold">₹{totalOps.toLocaleString()}</div>
        </div>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <EditFuelDialog
            log={editTarget}
            vehicles={vehicles}
            onSave={async (updated) => {
              try {
                await updateFuelLog(updated);
                await loadData();
                setEditTarget(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>

      <Dialog open={isAddExp || !!editExpTarget} onOpenChange={(o) => {
        if (!o) { setIsAddExp(false); setEditExpTarget(null); }
      }}>
        {(isAddExp || editExpTarget) && (
          <ExpenseFormDialog
            expense={editExpTarget || undefined}
            vehicles={vehicles}
            onSave={async (exp) => {
              try {
                if (exp.id) {
                  await updateExpense(exp);
                } else {
                  await addExpense(exp);
                }
                await loadData();
                setIsAddExp(false);
                setEditExpTarget(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function EditFuelDialog({ log, vehicles, onSave }: { log: FuelLog, vehicles: Vehicle[], onSave: (l: FuelLog) => void }) {
  const [form, setForm] = useState<FuelLog>(log);
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Edit Fuel Log</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="col-span-2 space-y-1.5">
          <Label>Vehicle</Label>
          <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Liters</Label>
          <Input type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Cost (₹)</Label>
          <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={form.date.split('T')[0]} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>Update Log</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ExpenseFormDialog({ expense, vehicles, onSave }: { expense?: Expense, vehicles: Vehicle[], onSave: (e: Expense) => void }) {
  const [form, setForm] = useState<Expense>(expense || {
    id: "", tripId: null, vehicleId: "", toll: 0, other: 0, date: new Date().toISOString().split('T')[0]
  });

  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="col-span-2 space-y-1.5">
          <Label>Vehicle</Label>
          <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Toll (₹)</Label>
          <Input type="number" value={form.toll} onChange={(e) => setForm({ ...form, toll: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Other Expense (₹)</Label>
          <Input type="number" value={form.other} onChange={(e) => setForm({ ...form, other: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={form.date.split('T')[0]} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button disabled={!form.vehicleId} className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>
          {expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
