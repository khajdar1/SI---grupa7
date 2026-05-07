"use client";

export const runtime = 'edge';

import { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";

import { PageHeader, PageLayout } from "@/components/shared";
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

export default function SlaConfigPage() {
  const [configs, setConfigs] = useState<SlaConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // No hook needed for sonner toast

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await getSlaConfigurations();
      setConfigs(data);
    } catch (error) {
      toast.error("Greška", {
        description: "Neuspješno učitavanje SLA konfiguracije.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
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
      toast.success("Uspjeh", {
        description: "SLA konfiguracija je sačuvana.",
      });
    } catch (error) {
      toast.error("Greška", {
        description: "Neuspješno spašavanje konfiguracije.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="SLA Konfiguracija"
        subtitle="Definišite rokove za rješavanje intervencija na osnovu nivoa prioriteta."
        breadcrumbs={[
          { label: "Admin", href: ROUTES.ADMIN },
          { label: "SLA Konfiguracija" },
        ]}
        primaryAction={{
          label: "Spasi promjene",
          onClick: handleSave,
          icon: <Save className="mr-2 h-4 w-4" />,
          isLoading: isSaving || isLoading,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{getPriorityLabel(config.priority)} Prioritet</CardTitle>
              <CardDescription>
                Vremenski rok za rješavanje intervencija ovog nivoa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`hours-${config.id}`}>Rok u satima</Label>
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
