import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVehicles, getMaintenanceLogs, openMaintenance, closeMaintenance, updateMaintenanceLog, deleteMaintenanceLog } from "@/lib/store";
import type { Vehicle, MaintenanceLog } from "@/types";
import { Plus, CheckCircle2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/maintenance")({ component: MaintenancePage });

type SortConfig = { key: keyof MaintenanceLog | 'vehicleReg'; direction: "asc" | "desc" } | null;

function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: "", service: "Oil Change", cost: 0 });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [editTarget, setEditTarget] = useState<MaintenanceLog | null>(null);
  const pageSize = 10;

  const loadData = async () => {
    try {
      const [vs, ls] = await Promise.all([getVehicles(), getMaintenanceLogs()]);
      setVehicles(vs);
      setLogs(ls);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, sortConfig]);

  const handleSort = (key: keyof MaintenanceLog | 'vehicleReg') => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof MaintenanceLog | 'vehicleReg' }) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const filteredLogs = useMemo(() => {
    let result = logs.filter((l) => {
      const v = vehicles.find((x) => x.id === l.vehicleId);
      if (!v) return true;
      return q === "" || v.regNumber.toLowerCase().includes(q.toLowerCase());
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof MaintenanceLog];
        let valB: any = b[sortConfig.key as keyof MaintenanceLog];
        
        if (sortConfig.key === 'vehicleReg') {
          valA = vehicles.find(v => v.id === a.vehicleId)?.regNumber || '';
          valB = vehicles.find(v => v.id === b.vehicleId)?.regNumber || '';
        }

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [logs, vehicles, q, sortConfig]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const addLog = async () => {
    if (!form.vehicleId) return;
    try {
      await openMaintenance({
        vehicleId: form.vehicleId,
        serviceType: form.service,
        cost: form.cost,
        dateOpened: new Date().toISOString().split('T')[0]
      });
      await loadData();
      setForm({ ...form, cost: 0 });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const completeLog = async (logId: string) => {
    try {
      await closeMaintenance(logId);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      try {
        await deleteMaintenanceLog(id);
        await loadData();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <>
      <PageHeader title="Maintenance" subtitle="Log service events and track shop status." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border bg-panel p-5">
          <div className="mb-4 text-sm font-semibold">Log Service Record</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>
                  ))}
                  {vehicles.length === 0 && <SelectItem value="none" disabled>No vehicles</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oil Change">Oil Change</SelectItem>
                  <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                  <SelectItem value="Tyre Replace">Tyre Replace</SelectItem>
                  <SelectItem value="Brake Service">Brake Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cost (₹)</Label>
              <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} className="border-border bg-canvas" />
            </div>
          </div>
          <div className="mt-5">
            <Button onClick={addLog} className="bg-warning text-warning-foreground hover:bg-warning/90">
              <Plus className="mr-1 h-4 w-4" /> Open Maintenance Record
            </Button>
          </div>
          <div className="mt-6 space-y-1 text-xs text-muted-foreground">
            <div><span className="text-success">Available</span> → vehicle returned to fleet.</div>
            <div><span className="text-warning">In Shop</span> → vehicle held for service.</div>
          </div>
        </Card>

        <Card className="border-border bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
            <div>
              <div className="text-sm font-semibold">Service Log</div>
              <div className="text-xs text-muted-foreground">All maintenance events</div>
            </div>
            <div className="relative w-full max-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vehicle reg..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 border-border bg-canvas pl-8 text-xs"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("vehicleReg")}>
                  Vehicle <SortIcon columnKey="vehicleReg" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("serviceType")}>
                  Service <SortIcon columnKey="serviceType" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("dateOpened")}>
                  Opened <SortIcon columnKey="dateOpened" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("dateClosed")}>
                  Closed <SortIcon columnKey="dateClosed" />
                </TableHead>
                <TableHead className="cursor-pointer text-right hover:text-foreground" onClick={() => handleSort("cost")}>
                  Cost <SortIcon columnKey="cost" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("status")}>
                  Status <SortIcon columnKey="status" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((l) => {
                const v = vehicles.find(x => x.id === l.vehicleId);
                return (
                  <TableRow key={l.id} className="border-border hover:bg-canvas">
                    <TableCell className="font-medium">{v?.regNumber || 'Unknown'}</TableCell>
                    <TableCell>{l.serviceType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.dateOpened ? new Date(l.dateOpened).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.dateClosed ? new Date(l.dateClosed).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">₹{l.cost.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={l.status === 'Open' ? 'In Shop' : 'Available'} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {l.status === 'Open' && (
                          <Button size="sm" variant="ghost" onClick={() => completeLog(l.id)} className="h-7 gap-1 text-xs text-success hover:text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Close
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditTarget(l)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-panel hover:text-foreground">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-danger/20 hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <div className="text-xs text-foreground">Page {page} of {totalPages}</div>
                <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <EditMaintenanceModal
            log={editTarget}
            vehicles={vehicles}
            onSave={async (updated) => {
              try {
                await updateMaintenanceLog(updated);
                await loadData();
                setEditTarget(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function EditMaintenanceModal({ log, vehicles, onSave }: { log: MaintenanceLog, vehicles: Vehicle[], onSave: (l: MaintenanceLog) => void }) {
  const [form, setForm] = useState<MaintenanceLog>(log);
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Edit Maintenance Log</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <Label>Vehicle</Label>
          <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Service Type</Label>
          <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Oil Change">Oil Change</SelectItem>
              <SelectItem value="Engine Repair">Engine Repair</SelectItem>
              <SelectItem value="Tyre Replace">Tyre Replace</SelectItem>
              <SelectItem value="Brake Service">Brake Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cost (₹)</Label>
          <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v: "Open" | "Closed") => setForm({ ...form, status: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date Opened</Label>
          <Input type="date" value={form.dateOpened} onChange={(e) => setForm({ ...form, dateOpened: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Date Closed</Label>
          <Input type="date" value={form.dateClosed || ""} onChange={(e) => setForm({ ...form, dateClosed: e.target.value || null })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>Update Record</Button>
      </DialogFooter>
    </DialogContent>
  );
}
