import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers, addUser, updateUser, deleteUser, getSettings, updateSettings } from "@/lib/store";
import type { User, UserRole, Settings } from "@/types";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const matrix = [
  { role: "Fleet Manager", perms: [true, true, true, true, true] },
  { role: "Driver", perms: [false, true, false, false, false] },
  { role: "Safety Officer", perms: [false, false, true, true, false] },
  { role: "Financial Analyst", perms: [true, false, false, true, true] },
];
const cols = ["Fleet", "Trips", "Drivers", "Fuel/Exp", "Analytics"];
const userRoles: UserRole[] = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"];

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ depotName: "", currency: "", distanceUnit: "" });
  const [users, setUsers] = useState<User[]>([]);
  
  const [isAddUser, setIsAddUser] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    try {
      const [s, u] = await Promise.all([getSettings(), getUsers()]);
      setSettings(s);
      setUsers(u);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings);
      alert("Settings saved successfully.");
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      await loadData();
    } catch (e: any) { alert(e.message); }
  };

  const totalPages = Math.ceil(users.length / pageSize);
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHeader title="Settings & User Management" subtitle="Company profile, access controls, and user accounts." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
        <Card className="border-border bg-panel p-5">
          <div className="mb-4 text-sm font-semibold">General</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Depot Name</Label>
              <Input value={settings.depotName} onChange={(e) => setSettings({ ...settings, depotName: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="border-border bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label>Distance Unit</Label>
              <Input value={settings.distanceUnit} onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })} className="border-border bg-canvas" />
            </div>
          </div>
          <Button className="mt-5 bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleSaveSettings}>Save changes</Button>
        </Card>

        <Card className="border-border bg-panel p-5">
          <div className="mb-4 text-sm font-semibold">Role-Based Access (RBAC) Matrix</div>
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

      <Card className="border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="text-sm font-semibold">System Users</div>
          <Button size="sm" variant="outline" className="border-border bg-canvas" onClick={() => setIsAddUser(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add User
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((u) => (
              <TableRow key={u.id} className="border-border hover:bg-canvas">
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                    <span className="text-destructive">Locked</span>
                  ) : (
                    <span className="text-success">Active</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditUser(u)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-panel hover:text-foreground">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.id)} className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, users.length)} of {users.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <div className="text-xs text-foreground">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" className="h-7 border-border bg-canvas px-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={isAddUser || !!editUser} onOpenChange={(o) => {
        if (!o) { setIsAddUser(false); setEditUser(null); }
      }}>
        {(isAddUser || editUser) && (
          <UserFormDialog
            user={editUser || undefined}
            roles={userRoles}
            onSave={async (u) => {
              try {
                if (u.id) {
                  await updateUser(u as User);
                } else {
                  await addUser(u);
                }
                await loadData();
                setIsAddUser(false);
                setEditUser(null);
              } catch (e: any) { alert(e.message); }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function UserFormDialog({ user, roles, onSave }: { user?: User, roles: UserRole[], onSave: (u: any) => void }) {
  const [form, setForm] = useState(user || {
    email: "", password: "", role: roles[0], failedAttempts: 0, lockedUntil: null
  });

  return (
    <DialogContent className="border-border bg-panel">
      <DialogHeader>
        <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border-border bg-canvas" />
        </div>
        {!user && (
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border-border bg-canvas" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
            <SelectTrigger className="border-border bg-canvas"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {user && (
          <div className="flex items-center justify-between rounded-md border border-border p-3 mt-2">
            <div>
              <div className="text-sm font-medium">Account Lock</div>
              <div className="text-xs text-muted-foreground">Currently: {form.lockedUntil && new Date(form.lockedUntil) > new Date() ? 'Locked' : 'Unlocked'}</div>
            </div>
            <Button size="sm" variant="outline" className="border-border bg-canvas" onClick={() => setForm({ ...form, lockedUntil: null, failedAttempts: 0 })}>
              Unlock Account
            </Button>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button disabled={!form.email || (!user && !form.password)} className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onSave(form)}>
          {user ? 'Update User' : 'Add User'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
