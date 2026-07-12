import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTrips, getDispatchVehicles, getDispatchDrivers, getVehicles, getDrivers, addTrip, dispatchTrip, completeTrip, cancelTrip, updateTrip } from "@/lib/store";
import type { Trip, TripStatus, Vehicle, Driver } from "@/types";
import { AlertOctagon, CheckCircle2, PlayCircle, Send, XCircle, Edit2, FileText, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/dispatcher")({ component: Dispatcher });

const flow: TripStatus[] = ["Draft", "Dispatched", "Completed"];

function Dispatcher() {
  const [board, setBoard] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargo: 400,
  });

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [editTarget, setEditTarget] = useState<Trip | null>(null);
  const [profileTarget, setProfileTarget] = useState<Trip | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Trip | null>(null);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const loadData = async () => {
    try {
      const [ts, vs, ds, av, ad] = await Promise.all([
        getTrips(), getDispatchVehicles(), getDispatchDrivers(), getVehicles(), getDrivers()
      ]);
      setBoard(ts);
      setVehicles(vs);
      setDrivers(ds);
      setAllVehicles(av);
      setAllDrivers(ad);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const overloaded = selectedVehicle ? form.cargo > selectedVehicle.maxLoadCapacity : false;

  const advance = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'Draft') {
        await dispatchTrip(id);
      } else if (currentStatus === 'On Trip' || currentStatus === 'Dispatched') {
        const t = board.find(x => x.id === id);
        if (t) setCompleteTarget(t);
        return;
      }
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const cancel = async (id: string) => {
    try {
      await cancelTrip(id);
      await loadData();
    } catch(e: any) {
      alert(e.message);
    }
  };

  const createTrip = async () => {
    if (overloaded) return;
    try {
      await addTrip({
        source: form.source || "Depot",
        destination: form.destination || "Client",
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeight: form.cargo,
        plannedDistance: 150,
        revenue: form.cargo * 10,
        finalOdometer: null,
        fuelUsed: null,
        remarks: "",
        status: "Draft"
      });
      await loadData();
      setForm({ ...form, source: "", destination: "" });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const stageIndex = (s: TripStatus) => flow.indexOf(s);

  const filtered = board.filter(t => 
    q === "" || t.id.toLowerCase().includes(q.toLowerCase()) || 
    t.source.toLowerCase().includes(q.toLowerCase()) || 
    t.destination.toLowerCase().includes(q.toLowerCase())
  );
  
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHeader title="Trip Dispatcher" subtitle="Create dispatches and drive trips through the lifecycle." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border bg-panel p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">Initialize Dispatch</div>
            <div className="text-xs text-muted-foreground">Draft → Dispatched → On Trip → Completed</div>
          </div>

          <div className="mb-6 flex items-center gap-2">
            {flow.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-canvas text-[10px] font-semibold">
                    {i + 1}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s}</div>
                </div>
                {i < flow.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Source</Label>
              <Input placeholder="Origin depot" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Destination</Label>
              <Input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue placeholder="Select available vehicle..." /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.regNumber} · {v.maxLoadCapacity}kg</SelectItem>
                  ))}
                  {vehicles.length === 0 && <SelectItem value="none" disabled>No vehicles available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger className="border-border bg-canvas"><SelectValue placeholder="Select available driver..." /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                  {drivers.length === 0 && <SelectItem value="none" disabled>No drivers available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Cargo Weight (kg)</Label>
              <Input type="number" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: +e.target.value })} className="border-border bg-canvas" />
            </div>
          </div>

          {selectedVehicle && (
            <div className={`mt-4 rounded-md border p-3 text-xs ${overloaded ? "border-danger/60 bg-danger/10 text-danger" : "border-border bg-canvas text-muted-foreground"}`}>
              <div className="flex items-start gap-2">
                {overloaded && <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />}
                <div>
                  <div className="font-medium">
                    Vehicle capacity: {selectedVehicle.maxLoadCapacity} kg · Cargo: {form.cargo} kg
                  </div>
                  {overloaded ? (
                    <div className="mt-0.5">Capacity exceeded by {form.cargo - selectedVehicle.maxLoadCapacity} kg — dispatch blocked.</div>
                  ) : (
                    <div className="mt-0.5">Within limits — ready to dispatch.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button disabled={overloaded || !form.vehicleId || !form.driverId} onClick={createTrip} className="bg-warning text-warning-foreground hover:bg-warning/90 disabled:opacity-50">
              <Send className="mr-1 h-4 w-4" /> Dispatch (draft)
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Cancel</Button>
          </div>
        </Card>

        <Card className="border-border bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
            <div>
              <div className="text-sm font-semibold">Live Board</div>
              <div className="text-xs text-muted-foreground">Move trips through their lifecycle</div>
            </div>
            <div className="relative w-full max-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search trip ID or location..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 border-border bg-canvas pl-8 text-xs"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Trip</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((t) => {
                const canAdvance = t.status !== "Completed" && t.status !== "Cancelled";
                const v = allVehicles.find(x => x.id === t.vehicleId);
                const d = allDrivers.find(x => x.id === t.driverId);
                return (
                  <TableRow key={t.id} className="border-border hover:bg-canvas">
                    <TableCell>
                      <button onClick={() => setProfileTarget(t)} className="text-left font-medium text-foreground hover:text-primary hover:underline">
                        {t.id.slice(0, 8)}
                      </button>
                      <div className="text-xs text-muted-foreground">{v?.regNumber || 'Unknown'} · {d?.name || 'Unknown'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.source} → {t.destination}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {canAdvance && (
                          <Button size="sm" variant="ghost" onClick={() => setEditTarget(t)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-panel hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canAdvance && (
                          <Button size="sm" variant="ghost" onClick={() => advance(t.id, t.status)} className="h-7 gap-1 text-xs">
                            {t.status === "Dispatched" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                            {flow[stageIndex(t.status as TripStatus) + 1] ?? "Done"}
                          </Button>
                        )}
                        {canAdvance && (
                          <Button size="sm" variant="ghost" onClick={() => cancel(t.id)} className="h-7 gap-1 text-xs text-danger hover:text-danger">
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
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
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
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
          <EditTripDialog
            trip={editTarget}
            vehicles={allVehicles}
            drivers={allDrivers}
            onSave={async (updated) => {
              try {
                await updateTrip(updated);
                await loadData();
                setEditTarget(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>
      <Dialog open={!!profileTarget} onOpenChange={(o) => !o && setProfileTarget(null)}>
        {profileTarget && <TripProfileDialog trip={profileTarget} vehicle={allVehicles.find(v => v.id === profileTarget.vehicleId)} driver={allDrivers.find(d => d.id === profileTarget.driverId)} />}
      </Dialog>
      <Dialog open={!!completeTarget} onOpenChange={(o) => !o && setCompleteTarget(null)}>
        {completeTarget && (
          <CompleteTripDialog
            trip={completeTarget}
            onComplete={async (odo, fuel) => {
              try {
                await completeTrip(completeTarget.id, odo, fuel);
                await loadData();
                setCompleteTarget(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function EditTripDialog({ trip, vehicles, drivers, onSave }: { trip: Trip, vehicles: Vehicle[], drivers: Driver[], onSave: (t: Trip) => void }) {
  const [form, setForm] = useState<Trip>(trip);
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Edit Trip</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Destination</Label>
          <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="border-border bg-canvas" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Cargo Weight (kg)</Label>
          <Input type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: +e.target.value })} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>Update Trip</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TripProfileDialog({ trip, vehicle, driver }: { trip: Trip, vehicle?: Vehicle, driver?: Driver }) {
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Trip Profile</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold font-mono text-foreground">{trip.id}</h2>
        <StatusBadge status={trip.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <div className="text-xs text-muted-foreground">Route</div>
          <div className="text-sm font-medium">{trip.source} → {trip.destination}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Cargo</div>
          <div className="text-sm">{trip.cargoWeight.toLocaleString()} kg</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Driver</div>
          <div className="text-sm">{driver?.name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Vehicle</div>
          <div className="text-sm">{vehicle?.regNumber || 'Unknown'} ({vehicle?.maxLoadCapacity}kg cap)</div>
        </div>
        {trip.status === "Completed" && (
          <>
            <div>
              <div className="text-xs text-muted-foreground">Final Odometer</div>
              <div className="text-sm font-medium">{trip.finalOdometer}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Fuel Used</div>
              <div className="text-sm font-medium text-danger">{trip.fuelUsed} L</div>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  );
}

function CompleteTripDialog({ trip, onComplete }: { trip: Trip, onComplete: (odo: number, fuel: number) => void }) {
  const [odo, setOdo] = useState("");
  const [fuel, setFuel] = useState("");
  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>Complete Trip</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="text-sm text-muted-foreground">
          You are completing trip <span className="font-mono text-foreground">{trip.id.slice(0, 8)}</span>. 
          Please enter the final readings below.
        </div>
        <div className="space-y-1.5">
          <Label>Final Odometer</Label>
          <Input type="number" placeholder="e.g. 54200" value={odo} onChange={(e) => setOdo(e.target.value)} className="border-border bg-canvas" />
        </div>
        <div className="space-y-1.5">
          <Label>Fuel Used (Liters)</Label>
          <Input type="number" placeholder="e.g. 45" value={fuel} onChange={(e) => setFuel(e.target.value)} className="border-border bg-canvas" />
        </div>
      </div>
      <DialogFooter>
        <Button 
          disabled={!odo || !fuel}
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          onClick={() => onComplete(+odo, +fuel)}
        >
          Confirm Completion
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
