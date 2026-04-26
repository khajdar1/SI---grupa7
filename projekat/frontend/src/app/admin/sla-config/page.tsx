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

/**
 * Map backend error keys to frontend field keys.
 * Backend may return errors with keys like "URGENT_hours", "config_0", etc.
 * Frontend always uses "PRIORITY_hours" format.
 */
function mapBackendErrors(
  backendErrors: Record<string, string>,
): Record<string, string> {
  const mappedErrors: Record<string, string> = {};

  for (const [key, message] of Object.entries(backendErrors)) {
    // Already in correct format: URGENT_hours, HIGH_hours, etc.
    if (key.match(/^(URGENT|HIGH|NORMAL|LOW)_hours$/)) {
      mappedErrors[key] = message;
    }
    // Backend request validator uses config_N format: extract priority from error message
    else if (key.startsWith("config_")) {
      // The error message should contain the priority info
      // Try to extract priority from message if present
      const message_str = String(message);
      for (const priority of ["URGENT", "HIGH", "NORMAL", "LOW"]) {
        if (message_str.includes(priority)) {
          mappedErrors[`${priority}_hours`] = message;
          break;
        }
      }
      // If priority not found in message, skip or use generic key
      if (!Object.values(mappedErrors).includes(message)) {
        mappedErrors["_general"] = message;
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

      const data: Record<string, string> = {};
      res.data.forEach((config: SlaConfig) => {
        data[config.priority] = String(config.deadlineHours);
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
    if (hours === null || hours === undefined || Number.isNaN(hours)) {
      return "Value cannot be empty";
    }

    if (!Number.isInteger(hours)) {
      return "Must be a whole number";
    }

    if (hours <= 0) {
      return "Must be greater than zero";
    }

    if (hours > 8760) {
      return "Value is too large (max 8760 hours)";
    }

    return "";
  };

  const handleInputChange = (priority: string, value: string) => {
    // Store raw string value in form state
    setFormData((prev) => ({
      ...prev,
      [priority]: value,
    }));

    // Validate the numeric value for immediate UX feedback
    let error = "";
    if (value === "") {
      error = "Value cannot be empty";
    } else {
      const numValue = Number(value);
      error = validateField(priority, numValue);
    }

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

    try {
      setSaving(true);

      const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];
      const configurations = priorityOrder.map((priority) => ({
        priority,
        deadlineHours: parseInt(formData[priority], 10),
      }));

      await api.put("/sla", { configurations });

      await fetchSlaConfigs();

      setSuccessMessage("SLA configuration updated successfully!");
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors || {};
      const mappedErrors = mapBackendErrors(backendErrors);

      // Extract and remove general errors from mapped errors
      const generalErrors = mappedErrors["_general"];
      if (generalErrors) {
        delete mappedErrors["_general"];
      }

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors(mappedErrors);
      }

      const mainMessage =
        err?.response?.data?.message || "Failed to update SLA configuration";
      const fullMessage = generalErrors
        ? `${mainMessage}. ${generalErrors}`
        : mainMessage;
      setError(fullMessage);
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
