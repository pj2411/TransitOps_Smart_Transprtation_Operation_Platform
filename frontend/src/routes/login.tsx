import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Truck, Eye, EyeOff, Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  /* Already logged in — redirect */
  if (user) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas relative">
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 rounded-md border border-border bg-panel p-2 text-muted-foreground transition hover:text-foreground z-10"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Left — Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            T
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">TransitOps</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-sidebar-foreground">
            Smart Transport Operations Platform
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Manage your fleet, drivers, dispatch, maintenance, and financials from a single high-contrast operations cockpit.
          </p>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>Real-time fleet tracking &amp; dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-success" />
              <span>Role-based access for every team</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-warning" />
              <span>Integrated fuel, maintenance &amp; analytics</span>
            </div>
          </div>
        </div>


      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-border bg-panel p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground lg:hidden">
              T
            </div>
            <h2 className="text-xl font-semibold text-foreground">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-canvas"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-canvas pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-border bg-canvas p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">Fleet Manager:</span> fleet@transitops.in / fleet123</div>
              <div><span className="font-medium text-foreground">Dispatcher:</span> dispatch@transitops.in / dispatch123</div>
              <div><span className="font-medium text-foreground">Safety Officer:</span> safety@transitops.in / safety123</div>
              <div><span className="font-medium text-foreground">Financial Analyst:</span> finance@transitops.in / finance123</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
