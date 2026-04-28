"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

interface SlaConfig {
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  deadlineHours: number;
  updatedAt: string;
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Hitan", color: "#d32f2f" },
  HIGH: { label: "Visok", color: "#f57c00" },
  NORMAL: { label: "Normalan", color: "#388e3c" },
  LOW: { label: "Nizak", color: "#1976d2" },
};

function mapBackendErrors(
  backendErrors: Record<string, string>,
): Record<string, string> {
  const mappedErrors: Record<string, string> = {};

  for (const [key, message] of Object.entries(backendErrors)) {
    if (key.match(/^(URGENT|HIGH|NORMAL|LOW)_hours$/)) {
      mappedErrors[key] = message;
    } else if (key.startsWith("config_")) {
      for (const priority of ["URGENT", "HIGH", "NORMAL", "LOW"]) {
        if (String(message).includes(priority)) {
          mappedErrors[`${priority}_hours`] = message;
          break;
        }
      }
    }
  }

  return mappedErrors;
}

export default function AdminSlaConfigPage() {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<Record<string, string>>({
    URGENT: "",
    HIGH: "",
    NORMAL: "",
    LOW: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatDate = (date?: string) => {
    if (!date) return "—";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("bs-BA");
  };

  const fetchSlaConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sla");
      setConfigs(res.data);

      const data: Record<string, string> = {};
      res.data.forEach((c: SlaConfig) => {
        data[c.priority] = String(c.deadlineHours);
      });

      setFormData(data);
      setFieldErrors({});
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load SLA configurations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlaConfigs();
  }, []);

  const validateField = (priority: string, value: string): string => {
    const label = PRIORITY_LABELS[priority].label;

    if (value === "") return `${label}: value cannot be empty`;

    const num = Number(value);

    if (!Number.isInteger(num)) return `${label}: must be whole number`;
    if (num <= 0) return `${label}: must be > 0`;
    if (num > 8760) return `${label}: max 8760h`;

    return "";
  };

  const handleInputChange = (priority: string, value: string) => {
    setFormData((prev) => ({ ...prev, [priority]: value }));

    const error = validateField(priority, value);

    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (error) updated[`${priority}_hours`] = error;
      else delete updated[`${priority}_hours`];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];

    const newErrors: Record<string, string> = {};
    for (const p of priorityOrder) {
      const err = validateField(p, formData[p]);
      if (err) newErrors[`${p}_hours`] = err;
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setSaving(true);

      const configurations = priorityOrder.map((p) => ({
        priority: p,
        deadlineHours: parseInt(formData[p], 10),
      }));

      await api.put("/sla", { configurations });

      await fetchSlaConfigs();
      setSuccessMessage("SLA configuration updated successfully!");
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors || {};
      setFieldErrors(mapBackendErrors(backendErrors));

      setError(
        err?.response?.data?.message || "Failed to update SLA configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>SLA Configuration</h1>

      {error && (
        <div style={{ background: "#fee2e2", padding: 10, marginBottom: 10 }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{ background: "#dcfce7", padding: 10, marginBottom: 10 }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* FORM */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 20,
            background: "#fff",
          }}
        >
          <h2 style={{ marginBottom: 15 }}>Update SLA</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map((p) => {
                const key = `${p}_hours`;
                const hasError = key in fieldErrors;

                return (
                  <div key={p} style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            background: PRIORITY_LABELS[p].color,
                            borderRadius: 2,
                          }}
                        />
                        {PRIORITY_LABELS[p].label}
                      </span>
                    </label>

                    <input
                      type="number"
                      value={formData[p]}
                      onChange={(e) => handleInputChange(p, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 6,
                        border: hasError
                          ? "2px solid #dc2626"
                          : "1px solid #ccc",
                      }}
                    />

                    {hasError && (
                      <p style={{ color: "#dc2626", fontSize: 12 }}>
                        {fieldErrors[key]}
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={saving || Object.keys(fieldErrors).length > 0}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#111827",
                  color: "white",
                  borderRadius: 6,
                  cursor: "pointer",
                  opacity:
                    saving || Object.keys(fieldErrors).length > 0 ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          )}
        </div>

        {/* DISPLAY */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 20,
            background: "#fff",
          }}
        >
          <h2 style={{ marginBottom: 15 }}>Current</h2>

          {loading ? (
            <p>Loading...</p>
          ) : configs.length > 0 ? (
            configs.map((c) => (
              <div
                key={c.priority}
                style={{
                  borderLeft: `4px solid ${PRIORITY_LABELS[c.priority].color}`,
                  padding: 10,
                  marginBottom: 10,
                  background: "#f9fafb",
                  borderRadius: 6,
                }}
              >
                <strong>{PRIORITY_LABELS[c.priority].label}</strong>
                <div style={{ fontSize: 18, fontWeight: "bold" }}>
                  {c.deadlineHours}h
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Updated: {formatDate(c.updatedAt)}
                </div>
              </div>
            ))
          ) : (
            <p>No data</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link href="/admin">← Back to Admin</Link>
      </div>
    </div>
  );
}
