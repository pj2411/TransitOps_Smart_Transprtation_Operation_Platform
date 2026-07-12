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
import { getDrivers, addDriver, updateDriver, deleteDriver } from "@/lib/store";
import type { Driver, DriverStatus } from "@/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, User } from "lucide-react";

export const Route = createFileRoute("/drivers")({ component: DriversPage });

const statuses: DriverStatus[] = ["Available", "On Trip", "Off Duty", "Suspended"];

function DriversPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<DriverStatus | "All">("All");
  const [rows, setRows] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [profileTarget, setProfileTarget] = useState<Driver | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    getDrivers().then(setRows).catch(console.error);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, active]);

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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        await deleteDriver(id);
        setRows(rows.filter((d) => d.id !== id));
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

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
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((d) => {
              const days = daysUntil(d.licenseExpiryDate);
              const expiring = days < 30;
              const percent = d.totalTrips ? Math.round((d.completedTrips / d.totalTrips) * 100) : 0;
              return (
                <TableRow key={d.id} className="border-border hover:bg-canvas">
                  <TableCell>
                    <button onClick={() => setProfileTarget(d)} className="text-left font-medium text-foreground hover:text-primary hover:underline">{d.name}</button>
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditTarget(d)} className="rounded p-1 text-muted-foreground hover:bg-panel hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="rounded p-1 text-muted-foreground hover:bg-danger/20 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="text-xs text-foreground">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" className="h-8 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
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

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <EditDriverDialog
            driver={editTarget}
            onSave={async (updated) => {
              try {
                const saved = await updateDriver(updated);
                setRows(rows.map(r => r.id === saved.id ? saved : r));
                setEditTarget(null);
              } catch (e: any) {
                alert(e.message);
              }
            }}
          />
        )}
      </Dialog>

      <Dialog open={!!profileTarget} onOpenChange={(o) => !o && setProfileTarget(null)}>
        {profileTarget && <DriverProfileDialog driver={profileTarget} />}
      </Dialog>
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

function EditDriverDialog({ driver, onSave }: { driver: Driver; onSave: (d: Driver) => void }) {
  const [form, setForm] = useState<Driver>(driver);
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Edit Driver</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="col-span-2 space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>License Number</Label>
          <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.licenseCategory} onValueChange={(v: any) => setForm({ ...form, licenseCategory: v })}>
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
          <Input type="date" value={form.licenseExpiryDate.split('T')[0]} onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="Off Duty">Off Duty</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>
          Update driver
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DriverProfileDialog({ driver }: { driver: Driver }) {
  const percent = driver.totalTrips ? Math.round((driver.completedTrips / driver.totalTrips) * 100) : 0;
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Driver Profile</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary">
          <User className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{driver.name}</h2>
          <div className="text-sm text-muted-foreground">{driver.contactNumber}</div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={driver.status} />
          <SafetyBadge score={driver.safetyScore} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <div className="text-xs text-muted-foreground">License Number</div>
          <div className="font-mono text-sm">{driver.licenseNumber}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Category & Expiry</div>
          <div className="text-sm">{driver.licenseCategory} • {new Date(driver.licenseExpiryDate).toLocaleDateString()}</div>
        </div>
        <div className="col-span-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Trip Completion</span>
            <span className="font-medium">{driver.completedTrips} / {driver.totalTrips}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
