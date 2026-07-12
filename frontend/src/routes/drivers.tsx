import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SafetyBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDrivers, addDriver } from "@/lib/store";
import type { Driver, DriverStatus } from "@/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/drivers")({ component: DriversPage });

const statuses: DriverStatus[] = ["Available", "On Trip", "Off Duty", "Suspended"];

function DriversPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<DriverStatus | "All">("All");
  const [rows, setRows] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getDrivers().then(setRows).catch(console.error);
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (d) =>
          (active === "All" || d.status === active) &&
          (q === "" || d.name.toLowerCase().includes(q.toLowerCase()) || d.licenseNumber.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, active],
  );

  const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <PageHeader
        title="Drivers & Safety Profiles"
        subtitle="Licenses, safety scores and duty status for every driver."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-warning text-warning-foreground hover:bg-warning/90">
                <Plus className="mr-1 h-4 w-4" /> Add Driver
              </Button>
            </DialogTrigger>
            <AddDriverDialog
              onAdd={async (d) => {
                try {
                  const saved = await addDriver(d);
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
              placeholder="Search driver name or license…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 border-border bg-canvas pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Driver</TableHead>
              <TableHead>License No</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Trip Compl.</TableHead>
              <TableHead>Safety</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const days = daysUntil(d.licenseExpiryDate);
              const expiring = days < 30;
              const percent = d.totalTrips ? Math.round((d.completedTrips / d.totalTrips) * 100) : 0;
              return (
                <TableRow key={d.id} className="border-border hover:bg-canvas">
                  <TableCell>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.licenseCategory}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                  <TableCell>
                    <div className={cn("flex items-center gap-1.5 text-sm", expiring && "text-danger")}>
                      {expiring && <AlertTriangle className="h-3.5 w-3.5" />}
                      {new Date(d.licenseExpiryDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.contactNumber}</TableCell>
                  <TableCell className="text-right">{percent}%</TableCell>
                  <TableCell><SafetyBadge score={d.safetyScore} /></TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No drivers match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-6">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Toggle by status</div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...statuses] as const).map((s) => {
            const isActive = active === s;
            return (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-panel text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AddDriverDialog({ onAdd }: { onAdd: (d: Omit<Driver, 'id'>) => void }) {
  const [form, setForm] = useState<Omit<Driver, 'id'>>({ name: "", licenseNumber: "", licenseCategory: "LMV", licenseExpiryDate: "2026-12-31", contactNumber: "", safetyScore: 100, totalTrips: 0, completedTrips: 0, status: "Available" });
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Add Driver</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="col-span-2 space-y-1.5">
          <Label>Name</Label>
          <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>License Number</Label>
          <Input placeholder="DL-XXX" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.licenseCategory} onValueChange={(v) => setForm({ ...form, licenseCategory: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LMV">LMV</SelectItem>
              <SelectItem value="HMV">HMV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Contact Number</Label>
          <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Expiry Date</Label>
          <Input type="date" value={form.licenseExpiryDate} onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button
          className="bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={() => onAdd(form)}
        >
          Save driver
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
