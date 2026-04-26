"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Category } from "../../../models/Category";

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
    try {
      if (isEditing) {
        await api.patch(`/categories/${formData.id}`, {
          name: formData.name,
          description: formData.description,
        });
      } else {
        await api.post("/categories", {
          name: formData.name,
          description: formData.description,
        });
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
    try {
      await api.patch(`/categories/${id}/status`, { active: !currentStatus });
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

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <h2 className="section-title">{isEditing ? "Edit Category" : "New Category"}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="stack-tight">
            {formError && <div style={{color: 'red', marginBottom: '10px'}}>{formError}</div>}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label>Name (unique):</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>
            <div className="button-row">
              <button type="submit" className="button button--solid">
                {isEditing ? "Update" : "Create"}
              </button>
              {isEditing && (
                <button type="button" onClick={handleCancel} className="button button--ghost">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <h2 className="section-title">All Categories</h2>
          </div>
          
          {loading ? (
            <p>Loading...</p>
          ) : categories.length === 0 ? (
            <p style={{color: 'orange'}}>Warning: System has no active categories. Users won&apos;t be able to report faults.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map((c) => (
                <div key={c.id} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px' }}>
                  <h3 style={{margin: '0 0 8px 0'}}>
                     {c.name} 
                     {c.active ? <span style={{color: "green", fontSize: '14px', marginLeft: '8px'}}>(Active)</span> : <span style={{color: "darkred", fontSize: '14px', marginLeft: '8px'}}>(Inactive)</span>}
                  </h3>
                  {c.description && <p style={{ fontSize: '0.9em', color: '#555', margin: '0 0 8px 0' }}>{c.description}</p>}
                  <p style={{ fontSize: '0.8em', color: '#888', margin: '0 0 12px 0' }}>
                     Created: {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  <div className="button-row">
                    <button 
                       type="button" 
                       className="button button--ghost" 
                       onClick={() => handleEdit(c)}
                       disabled={!c.active}
                       style={{opacity: c.active ? 1 : 0.5}}
                    >
                      Edit
                    </button>
                    <button 
                       type="button" 
                       className={c.active ? "button button--ghost" : "button button--solid"}
                       onClick={() => handleToggleStatus(c.id, c.active)}
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
