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

export default function AdminSlaConfigPage() {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<Record<string, string | number>>({
    URGENT: "",
    HIGH: "",
    NORMAL: "",
    LOW: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("bs-BA");
  };

  const fetchSlaConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sla");
      setConfigs(res.data);

      const data: Record<string, string | number> = {};
      res.data.forEach((config: SlaConfig) => {
        data[config.priority] = config.deadlineHours;
      });

      setFormData(data);
      setError("");
      setFieldErrors({});
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

  const validateField = (priority: string, hours: number): string => {
    const priorityLabel = PRIORITY_LABELS[priority]?.label ?? priority;

    if (hours === null || hours === undefined || Number.isNaN(hours)) {
      return `${priorityLabel}: value cannot be empty`;
    }

    if (!Number.isInteger(hours)) {
      return `${priorityLabel}: must be a whole number`;
    }

    if (hours <= 0) {
      return `${priorityLabel}: must be greater than zero`;
    }

    if (hours > 8760) {
      return `${priorityLabel}: value is too large (max 8760 hours)`;
    }

    return "";
  };

  const handleInputChange = (priority: string, value: string) => {
    const newValue = value === "" ? "" : Number(value);

    setFormData((prev) => ({
      ...prev,
      [priority]: newValue,
    }));

    const error =
      newValue === ""
        ? "Value cannot be empty"
        : validateField(priority, Number(newValue));

    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[`${priority}_hours`] = error;
      } else {
        delete updated[`${priority}_hours`];
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];

    for (const priority of priorityOrder) {
      const value = formData[priority];

      if (value === "") {
        newFieldErrors[`${priority}_hours`] = "Value cannot be empty";
        continue;
      }

      const error = validateField(priority, Number(value));
      if (error) {
        newFieldErrors[`${priority}_hours`] = error;
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    try {
      setSaving(true);

      const configurations = priorityOrder.map((priority) => ({
        priority,
        deadlineHours: Number(formData[priority]),
      }));

      await api.put("/sla", { configurations });

      await fetchSlaConfigs();

      setSuccessMessage("SLA configuration updated successfully!");
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors || {};
      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
      }

      setError(
        err?.response?.data?.message || "Failed to update SLA configuration",
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

      {error && <div style={{ color: "red" }}>{error}</div>}
      {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}

      <section className="split-grid">
        <article>
          <h2>Update SLA Timeouts</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map(
                (priority) => {
                  const fieldKey = `${priority}_hours`;
                  const hasError = fieldKey in fieldErrors;

                  return (
                    <div key={priority}>
                      <label>
                        {PRIORITY_LABELS[priority].label}
                        <input
                          type="number"
                          value={formData[priority]}
                          onChange={(e) =>
                            handleInputChange(priority, e.target.value)
                          }
                        />
                      </label>

                      {hasError && (
                        <p style={{ color: "red" }}>{fieldErrors[fieldKey]}</p>
                      )}
                    </div>
                  );
                },
              )}

              <button
                type="submit"
                disabled={saving || Object.keys(fieldErrors).length > 0}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </article>

        <article>
          <h2>Current Configuration</h2>

          {loading ? (
            <p>Loading...</p>
          ) : configs.length > 0 ? (
            configs.map((c) => (
              <div key={c.priority}>
                <strong>{c.priority}</strong>: {c.deadlineHours}h
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Updated: {formatDate(c.updatedAt)}
                </div>
              </div>
            ))
          ) : (
            <p>No data</p>
          )}
        </article>
      </section>

      <Link href="/admin">Back</Link>
    </div>
  );
}
