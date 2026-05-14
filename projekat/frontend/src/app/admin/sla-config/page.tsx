"use client";

export const runtime = 'edge';

import { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";

import { AccessDenied, PageHeader, PageLayout } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getSlaConfigurations,
  updateSlaConfigurations,
  getPriorityLabel,
  type SlaConfiguration
} from "@/services/sla.service";
import { ROUTES } from "@/constants";

function hasAdminRole(): boolean {
  if (typeof window === 'undefined') return false;
  const token = window.localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };
    const roles = [
      ...(payload.realm_access?.roles ?? []),
      ...Object.values(payload.resource_access ?? {}).flatMap((a) => a.roles ?? []),
    ].map((r) => r.toLowerCase());
    return roles.includes('admin') || roles.includes('administrator');
  } catch { return false; }
}

export default function SlaConfigPage() {
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [configs, setConfigs] = useState<SlaConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await getSlaConfigurations();
      setConfigs(data);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to load SLA configuration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canUseAdmin = hasAdminRole();
    setAuthorized(canUseAdmin);
    setIsGuest(!token);
    if (canUseAdmin) {
      loadConfigs();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateHours = (id: number, hours: string) => {
    const val = parseInt(hours, 10);
    if (isNaN(val) || val < 1) return;

    setConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, deadlineHours: val } : c))
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = configs.map(c => ({
        priority: c.priority,
        deadlineHours: c.deadlineHours,
      }));
      await updateSlaConfigurations(updates);
      toast.success("Success", {
        description: "SLA configuration has been saved.",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!authorized) {
    return <AccessDenied reason={isGuest ? 'unauthenticated' : 'unauthorized'} requiredRole="Admin" />;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="SLA Configuration"
        subtitle="Define intervention resolution deadlines by priority level."
        breadcrumbs={[
          { label: "Admin", href: ROUTES.ADMIN },
          { label: "SLA Configuration" },
        ]}
        primaryAction={{
          label: "Save Changes",
          onClick: handleSave,
          icon: <Save className="mr-2 h-4 w-4" />,
          isLoading: isSaving || isLoading,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{getPriorityLabel(config.priority)} Priority</CardTitle>
              <CardDescription>
                Resolution deadline for interventions at this level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`hours-${config.id}`}>Deadline in Hours</Label>
                  <Input
                    id={`hours-${config.id}`}
                    type="number"
                    min="1"
                    value={config.deadlineHours}
                    onChange={(e) => handleUpdateHours(config.id, e.target.value)}
                  />
                </div>
                <div className="mt-8 text-sm text-muted-foreground">
                  {Math.floor(config.deadlineHours / 24)} d, {config.deadlineHours % 24} h
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <div className="col-span-full flex items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
