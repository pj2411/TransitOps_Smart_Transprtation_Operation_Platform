import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from "@/lib/store";
import type { Vehicle } from "@/types";
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, FileText, Upload } from "lucide-react";

export const Route = createFileRoute("/fleet")({ component: FleetPage });

type SortConfig = { key: keyof Vehicle; direction: "asc" | "desc" } | null;

function FleetPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const pageSize = 10;

  useEffect(() => {
    getVehicles().then(setRows).catch(console.error);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [type, status, q, sortConfig]);

  const handleSort = (key: keyof Vehicle) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Vehicle }) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const filtered = useMemo(() => {
    let result = rows.filter(
      (v) =>
        (type === "all" || v.type === type) &&
        (status === "all" || v.status === status) &&
        (q === "" || v.regNumber.toLowerCase().includes(q.toLowerCase()) || v.nameModel.toLowerCase().includes(q.toLowerCase())),
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, type, status, q, sortConfig]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
      try {
        await deleteVehicle(id);
        setRows(rows.filter((v) => v.id !== id));
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Fleet Registry"
        subtitle="Every vehicle in your fleet, at a glance."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-warning text-warning-foreground hover:bg-warning/90">
                <Plus className="mr-1 h-4 w-4" /> Add Vehicle
              </Button>
            </DialogTrigger>
            <AddVehicleDialog
              onAdd={async (v) => {
                try {
                  const saved = await addVehicle(v);
                  setRows((r) => [saved, ...r]);
                  setOpen(false);
                } catch (e: any) {
                  alert(e.message);
                }
              }}
            />
          </Dialog>
        }
      />

      <Card className="border-border bg-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reg no or model…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 border-border bg-canvas pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-40 border-border bg-canvas">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Mini">Mini</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-40 border-border bg-canvas">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("regNumber")}>
                Reg. No <SortIcon columnKey="regNumber" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("nameModel")}>
                Model <SortIcon columnKey="nameModel" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("type")}>
                Type <SortIcon columnKey="type" />
              </TableHead>
              <TableHead className="cursor-pointer text-right hover:text-foreground" onClick={() => handleSort("maxLoadCapacity")}>
                Capacity (kg) <SortIcon columnKey="maxLoadCapacity" />
              </TableHead>
              <TableHead className="cursor-pointer text-right hover:text-foreground" onClick={() => handleSort("odometer")}>
                Odometer <SortIcon columnKey="odometer" />
              </TableHead>
              <TableHead className="cursor-pointer text-right hover:text-foreground" onClick={() => handleSort("acquisitionCost")}>
                Acq. Cost <SortIcon columnKey="acquisitionCost" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("status")}>
                Status <SortIcon columnKey="status" />
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((v) => (
              <TableRow key={v.id} className="border-border hover:bg-canvas">
                <TableCell className="font-medium">{v.regNumber}</TableCell>
                <TableCell>{v.nameModel}</TableCell>
                <TableCell className="text-muted-foreground">{v.type}</TableCell>
                <TableCell className="text-right">{v.maxLoadCapacity.toLocaleString()}</TableCell>
                <TableCell className="text-right">{v.odometer.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{v.acquisitionCost.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditTarget(v)} className="rounded p-1 text-muted-foreground hover:bg-panel hover:text-foreground">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="rounded p-1 text-muted-foreground hover:bg-danger/20 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No vehicles match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-foreground">
                Page {page} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <VehicleProfileDialog
            vehicle={editTarget}
            onSave={async (updated) => {
              try {
                const saved = await updateVehicle(updated);
                setRows(rows.map(r => r.id === saved.id ? saved : r));
                setEditTarget(null);
              } catch (e: any) {
                alert(e.message);
              }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function AddVehicleDialog({ onAdd }: { onAdd: (v: Omit<Vehicle, 'id'>) => void }) {
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>({ regNumber: "", nameModel: "", type: "Van", maxLoadCapacity: 500, odometer: 0, acquisitionCost: 0, status: "Available" });
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Add Vehicle</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="col-span-2 space-y-1.5">
          <Label>Registration No</Label>
          <Input placeholder="GTO-A00000" value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Model</Label>
          <Input placeholder="Van-05" value={form.nameModel} onChange={(e) => setForm({ ...form, nameModel: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Mini">Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Capacity (kg)</Label>
          <Input type="number" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Odometer</Label>
          <Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Acquisition Cost (₹)</Label>
          <Input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => onAdd(form)}>Save vehicle</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function VehicleProfileDialog({ vehicle, onSave }: { vehicle: Vehicle; onSave: (v: Vehicle) => void }) {
  const [form, setForm] = useState<Vehicle>(vehicle);
  const [docs, setDocs] = useState([{ name: "Insurance", date: "2026-12-01", status: 'Valid' }, { name: "Registration", date: "2028-05-15", status: 'Valid' }]);

  const handleSimulateUpload = () => {
    const name = prompt("Enter document name (e.g. PUC Certificate)");
    if (name) {
      setDocs([...docs, { name, date: "2025-10-10", status: 'Pending Verification' }]);
    }
  };

  return (
    <DialogContent className="border-border bg-panel max-w-2xl">
      <DialogHeader>
        <DialogTitle>{vehicle.regNumber} Profile</DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="details" className="mt-2">
        <TabsList className="bg-canvas border border-border">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Registration No</Label>
              <Input value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.nameModel} onChange={(e) => setForm({ ...form, nameModel: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Mini">Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Capacity (kg)</Label>
              <Input type="number" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Odometer</Label>
              <Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Acquisition Cost (₹)</Label>
              <Input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Trip">On Trip</SelectItem>
                  <SelectItem value="In Shop">In Shop</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>Update vehicle</Button>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-semibold">Attached Documents</div>
            <Button size="sm" variant="outline" className="border-border bg-canvas" onClick={handleSimulateUpload}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload PDF
            </Button>
          </div>
          <div className="space-y-3">
            {docs.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border border-border bg-canvas">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-panel rounded-md text-info"><FileText className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-medium">{d.name}.pdf</div>
                    <div className="text-xs text-muted-foreground">Expires: {d.date}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{d.status}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}
