"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api } from "../../../lib/api";

interface SlaConfig {
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  deadlineHours: number;
  updatedAt: string;
}

const PRIORITY_LABELS: Record<SlaConfig["priority"], { label: string; color: string }> = {
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
      continue;
    }

    if (!key.startsWith("config_")) {
      continue;
    }

    for (const priority of ["URGENT", "HIGH", "NORMAL", "LOW"] as const) {
      if (String(message).includes(priority)) {
        mappedErrors[`${priority}_hours`] = message;
        break;
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
  const [formData, setFormData] = useState<Record<SlaConfig["priority"], string>>({
    URGENT: "",
    HIGH: "",
    NORMAL: "",
    LOW: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("bs-BA");
  };

  const fetchSlaConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sla");
      setConfigs(res.data);

      const nextFormData: Record<SlaConfig["priority"], string> = {
        URGENT: "",
        HIGH: "",
        NORMAL: "",
        LOW: "",
      };

      res.data.forEach((config: SlaConfig) => {
        nextFormData[config.priority] = String(config.deadlineHours);
      });

      setFormData(nextFormData);
      setFieldErrors({});
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Failed to load SLA configurations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlaConfigs();
  }, []);

  const validateField = (priority: SlaConfig["priority"], value: string) => {
    const label = PRIORITY_LABELS[priority].label;

    if (value === "") {
      return `${label}: vrijednost je obavezna.`;
    }

    const numericValue = Number(value);

    if (!Number.isInteger(numericValue)) {
      return `${label}: unesite cijeli broj sati.`;
    }

    if (numericValue <= 0) {
      return `${label}: vrijednost mora biti veća od 0.`;
    }

    if (numericValue > 8760) {
      return `${label}: maksimalna vrijednost je 8760 sati.`;
    }

    return "";
  };

  const handleInputChange = (priority: SlaConfig["priority"], value: string) => {
    setFormData((prev) => ({ ...prev, [priority]: value }));

    const message = validateField(priority, value);

    setFieldErrors((prev) => {
      const updated = { ...prev };

      if (message) {
        updated[`${priority}_hours`] = message;
      } else {
        delete updated[`${priority}_hours`];
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const priorities: SlaConfig["priority"][] = ["URGENT", "HIGH", "NORMAL", "LOW"];
    const nextErrors: Record<string, string> = {};

    for (const priority of priorities) {
      const message = validateField(priority, formData[priority]);
      if (message) {
        nextErrors[`${priority}_hours`] = message;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);

      const configurations = priorities.map((priority) => ({
        priority,
        deadlineHours: parseInt(formData[priority], 10),
      }));

      await api.put("/sla", { configurations });
      await fetchSlaConfigs();
      setSuccessMessage("SLA konfiguracija je uspješno sačuvana.");
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors ?? {};
      setFieldErrors(mapBackendErrors(backendErrors));
      setError(
        err?.response?.data?.message ?? "Failed to update SLA configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Administration</span>
        <h1 className="section-title">SLA Configuration</h1>
      </section>

      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <h2 className="section-title">Update SLA Timeouts</h2>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form className="stack-tight" onSubmit={handleSubmit}>
              {(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map((priority) => {
                const fieldKey = `${priority}_hours`;
                const hasError = fieldKey in fieldErrors;

                return (
                  <div key={priority} className="field">
                    <label className="field-label" htmlFor={fieldKey}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: PRIORITY_LABELS[priority].color,
                        }}
                      />
                      {PRIORITY_LABELS[priority].label}
                      <span className="field-required">*</span>
                    </label>

                    <input
                      id={fieldKey}
                      className={hasError ? "field-input--error" : undefined}
                      type="number"
                      min={1}
                      max={8760}
                      step={1}
                      required
                      value={formData[priority]}
                      onChange={(event) =>
                        handleInputChange(priority, event.target.value)
                      }
                      aria-invalid={hasError}
                      aria-describedby={hasError ? `${fieldKey}-error` : undefined}
                    />

                    {hasError && (
                      <p id={`${fieldKey}-error`} className="field-error">
                        {fieldErrors[fieldKey]}
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                className="button button--solid"
                disabled={saving || Object.keys(fieldErrors).length > 0}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          )}
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <h2 className="section-title">Current Configuration</h2>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : configs.length > 0 ? (
            configs.map((config) => (
              <div
                key={config.priority}
                className="panel panel--soft stack-tight"
                style={{
                  padding: 18,
                  borderLeft: `4px solid ${PRIORITY_LABELS[config.priority].color}`,
                }}
              >
                <strong>{PRIORITY_LABELS[config.priority].label}</strong>
                <span style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  {config.deadlineHours}h
                </span>
                <span className="field-help">
                  Updated: {formatDate(config.updatedAt)}
                </span>
              </div>
            ))
          ) : (
            <p>No data</p>
          )}
        </article>
      </section>

      <div className="button-row">
        <Link className="button button--ghost" href="/admin">
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
