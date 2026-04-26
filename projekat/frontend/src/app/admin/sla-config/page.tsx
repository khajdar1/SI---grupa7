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

  const [formData, setFormData] = useState<Record<string, number>>({
    URGENT: 0,
    HIGH: 0,
    NORMAL: 0,
    LOW: 0,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchSlaConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sla");
      setConfigs(res.data);
      const data: Record<string, number> = {};
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
    if (hours === null || hours === undefined) {
      return "Value cannot be empty";
    }

    const numHours = Number(hours);

    if (!Number.isInteger(numHours)) {
      return "Must be a whole number";
    }

    if (numHours <= 0) {
      return "Must be greater than zero";
    }

    if (numHours > 8760) {
      return "Value is too large (max 8760 hours)";
    }

    return "";
  };

  const handleInputChange = (priority: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setFormData((prev) => ({
      ...prev,
      [priority]: numValue,
    }));

    // Real-time validation
    const error = validateField(priority, numValue);
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

    // Client-side validation
    const newFieldErrors: Record<string, string> = {};
    const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];

    for (const priority of priorityOrder) {
      const error = validateField(priority, formData[priority]);
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
        deadlineHours: formData[priority],
      }));

      await api.put("/sla", { configurations });
      setSuccessMessage("SLA configuration updated successfully!");
      fetchSlaConfigs();
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
        <p className="section-copy">
          Define response time deadlines (in hours) for each intervention
          priority level. These deadlines serve as the basis for delay
          notifications and service metrics.
        </p>
      </section>

      {error && (
        <div
          style={{
            color: "#b91c1c",
            padding: "12px",
            backgroundColor: "#fee2e2",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            color: "#065f46",
            padding: "12px",
            backgroundColor: "#dcfce7",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {successMessage}
        </div>
      )}

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <h2 className="section-title">Update SLA Timeouts</h2>
          </div>

          {loading ? (
            <p>Loading SLA configurations...</p>
          ) : (
            <form onSubmit={handleSubmit} className="stack-tight">
              {(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map(
                (priority) => {
                  const fieldKey = `${priority}_hours`;
                  const hasError = fieldKey in fieldErrors;
                  const priorityConfig = PRIORITY_LABELS[priority];

                  return (
                    <div key={priority}>
                      <label
                        className="field"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              backgroundColor: priorityConfig.color,
                            }}
                          />
                          {priorityConfig.label}{" "}
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            ({priority})
                          </span>
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="8760"
                          value={formData[priority] || ""}
                          onChange={(e) =>
                            handleInputChange(priority, e.target.value)
                          }
                          placeholder="e.g. 2, 8, 24, 72"
                          aria-invalid={hasError}
                          className={hasError ? "input-invalid" : ""}
                          style={{
                            padding: "8px",
                            border: hasError
                              ? "2px solid #b91c1c"
                              : "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                        {hasError && (
                          <span
                            className="field-error"
                            style={{
                              color: "#b91c1c",
                              fontSize: "12px",
                              marginTop: "2px",
                            }}
                          >
                            {fieldErrors[fieldKey]}
                          </span>
                        )}
                      </label>
                    </div>
                  );
                },
              )}

              <div
                className="button-row"
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={saving || Object.keys(fieldErrors).length > 0}
                  className="button button--solid"
                  style={{
                    opacity:
                      saving || Object.keys(fieldErrors).length > 0 ? 0.6 : 1,
                    cursor:
                      saving || Object.keys(fieldErrors).length > 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save SLA Configuration"}
                </button>
              </div>
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map(
                (priority) => {
                  const config = configs.find((c) => c.priority === priority);
                  const priorityConfig = PRIORITY_LABELS[priority];

                  return (
                    <div
                      key={priority}
                      style={{
                        padding: "12px",
                        border: "1px solid #e5e7eb",
                        borderLeft: `4px solid ${priorityConfig.color}`,
                        borderRadius: "4px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              fontWeight: "500",
                              fontSize: "14px",
                            }}
                          >
                            {priorityConfig.label}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#666",
                            }}
                          >
                            Updated:{" "}
                            {new Date(
                              config?.updatedAt || "",
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: priorityConfig.color,
                          }}
                        >
                          {config?.deadlineHours}h
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <p style={{ color: "#d97706" }}>
              No SLA configurations found. Please save initial configuration
              above.
            </p>
          )}
        </article>
      </section>

      <div
        className="button-row"
        style={{
          marginTop: "20px",
        }}
      >
        <Link className="button button--ghost" href="/admin">
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
