"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Category } from "../../../models/Category";

function getAdminName(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as { firstName?: string; lastName?: string; username?: string };
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    return displayName || user.username || null;
  } catch {
    return null;
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ id: 0, name: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const adminName = getAdminName();

    if (!adminName) {
      setFormError("Admin identity is required to save category changes.");
      return;
    }

    try {
      if (isEditing) {
        await api.patch(
          `/categories/${formData.id}`,
          {
            name: formData.name,
            description: formData.description,
          },
          {
            headers: { "x-admin-name": adminName },
          },
        );
      } else {
        await api.post(
          "/categories",
          {
            name: formData.name,
            description: formData.description,
          },
          {
            headers: { "x-admin-name": adminName },
          },
        );
      }
      setFormData({ id: 0, name: "", description: "" });
      setIsEditing(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "An error occurred.");
    }
  };

  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setFormData({ id: category.id, name: category.name, description: category.description || "" });
    setFormError("");
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const adminName = getAdminName();

    if (!adminName) {
      setError("Admin identity is required to change category status.");
      return;
    }

    try {
      await api.patch(
        `/categories/${id}/status`,
        { active: !currentStatus },
        {
          headers: { "x-admin-name": adminName },
        },
      );
      fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update status.");
    }
  };

  const handleCancel = () => {
    setFormData({ id: 0, name: "", description: "" });
    setIsEditing(false);
    setFormError("");
  };

  const activeCategories = categories.filter((category) => category.active);

  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Administration</span>
        <h1 className="section-title">Manage Categories</h1>
        <p className="section-copy">
          Create, edit, and toggle categories for fault reports.
        </p>
      </section>

      {error && <div style={{color: 'red', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>{error}</div>}

      <section className="split-grid" style={{ alignItems: 'start' }}>
        <article className="panel stack-tight" style={{ alignSelf: 'start', padding: '1rem', gap: '0.85rem' }}>
          <div className="section-heading section-heading--compact" style={{ marginBottom: 0 }}>
            <h2 className="section-title">{isEditing ? "Edit Category" : "New Category"}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="stack-tight" style={{ gap: '0.8rem' }}>
            {formError && <div style={{color: 'red', marginBottom: '10px'}}>{formError}</div>}
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
              <label style={{ fontSize: '0.92rem' }}>Name (unique):</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
              <label style={{ fontSize: '0.92rem' }}>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc', borderRadius: '4px', minHeight: '64px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <div className="button-row" style={{ gap: '0.5rem' }}>
              <button type="submit" className="button button--solid" style={{ padding: '0.65rem 1rem' }}>
                {isEditing ? "Update" : "Create"}
              </button>
              {isEditing && (
                <button type="button" onClick={handleCancel} className="button button--ghost" style={{ padding: '0.65rem 1rem' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="panel stack-tight" style={{ alignSelf: 'start', maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}>
          <div className="section-heading section-heading--compact" style={{ marginBottom: 0 }}>
            <h2 className="section-title">All Categories</h2>
          </div>

          {!loading && activeCategories.length === 0 && (
            <p style={{color: 'orange', marginBottom: '0.75rem'}}>Warning: System has no active categories. Users won&apos;t be able to report faults.</p>
          )}
          
          {loading ? (
            <p>Loading...</p>
          ) : categories.length === 0 ? (
            <p>No categories available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.25rem', flex: 1 }}>
              {categories.map((c) => (
                <div key={c.id} style={{ border: '1px solid #eee', padding: '0.85rem', borderRadius: '6px' }}>
                  <h3 style={{margin: '0 0 0.4rem 0', fontSize: '1rem'}}>
                     {c.name} 
                     {c.active ? <span style={{color: "green", fontSize: '14px', marginLeft: '8px'}}>(Active)</span> : <span style={{color: "darkred", fontSize: '14px', marginLeft: '8px'}}>(Inactive)</span>}
                  </h3>
                  {c.description && <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 0.4rem 0' }}>{c.description}</p>}
                  <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 0.25rem 0' }}>
                     Created: {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 0.65rem 0' }}>
                     Created by: {c.createdByName || 'System'} · Last updated by: {c.updatedByName || c.createdByName || 'System'}
                  </p>
                  <div className="button-row" style={{ gap: '0.5rem' }}>
                    <button 
                       type="button" 
                       className="button button--ghost" 
                       onClick={() => handleEdit(c)}
                       disabled={!c.active}
                       style={{opacity: c.active ? 1 : 0.5, padding: '0.6rem 0.9rem'}}
                    >
                      Edit
                    </button>
                    <button 
                       type="button" 
                       className={c.active ? "button button--ghost" : "button button--solid"}
                       onClick={() => handleToggleStatus(c.id, c.active)}
                       style={{ padding: '0.6rem 0.9rem' }}
                    >
                      {c.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
      
      <div className="button-row" style={{marginTop: '20px'}}>
        <Link className="button button--ghost" href="/admin">
           Back to Admin Shell
        </Link>
      </div>
    </div>
  );
}
