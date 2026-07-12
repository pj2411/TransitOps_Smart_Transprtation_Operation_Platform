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
import { getVehicles, addVehicle } from "@/lib/store";
import type { Vehicle } from "@/types";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/fleet")({ component: FleetPage });

function FleetPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getVehicles().then(setRows).catch(console.error);
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (v) =>
          (type === "all" || v.type === type) &&
          (status === "all" || v.status === status) &&
          (q === "" || v.regNumber.toLowerCase().includes(q.toLowerCase()) || v.nameModel.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, type, status, q],
  );

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
              <TableHead>Reg. No</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Capacity (kg)</TableHead>
              <TableHead className="text-right">Odometer</TableHead>
              <TableHead className="text-right">Acq. Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id} className="border-border hover:bg-canvas">
                <TableCell className="font-medium">{v.regNumber}</TableCell>
                <TableCell>{v.nameModel}</TableCell>
                <TableCell className="text-muted-foreground">{v.type}</TableCell>
                <TableCell className="text-right">{v.maxLoadCapacity.toLocaleString()}</TableCell>
                <TableCell className="text-right">{v.odometer.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{v.acquisitionCost.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No vehicles match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
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
        <Button
          className="bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={() => onAdd(form)}
        >
          Save vehicle
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
