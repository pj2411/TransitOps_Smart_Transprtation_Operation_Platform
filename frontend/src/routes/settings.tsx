import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const matrix = [
  { role: "Fleet Manager", perms: [true, true, true, true, true] },
  { role: "Dispatcher", perms: [true, true, true, false, false] },
  { role: "Safety Officer", perms: [false, false, true, true, false] },
  { role: "Financial Analyst", perms: [true, false, false, true, true] },
];
const cols = ["Fleet", "Dispatch", "Drivers", "Fuel/Exp", "Analytics"];

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings & RBAC" subtitle="Company profile and role-based access controls." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border bg-panel p-5">
          <div className="mb-4 text-sm font-semibold">General</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Depot Name</Label>
              <Input defaultValue="Ranchhannagar Depot HQ" className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input defaultValue="INR (₹)" className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Distance Unit</Label>
              <Input defaultValue="Kilometres" className="border-border bg-canvas" />
            </div>
          </div>
          <Button className="mt-5 bg-warning text-warning-foreground hover:bg-warning/90">Save changes</Button>
        </Card>

        <Card className="border-border bg-panel p-5">
          <div className="mb-4 text-sm font-semibold">Role-Based Access (RBAC)</div>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Role</th>
                  {cols.map((c) => <th key={c} className="p-3 text-center">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.map((r) => (
                  <tr key={r.role} className="border-t border-border">
                    <td className="p-3 font-medium">{r.role}</td>
                    {r.perms.map((p, i) => (
                      <td key={i} className="p-3 text-center">
                        {p ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/60" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
