"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import Link from 'next/link';
import { api } from "../../lib/api";
import { Category } from "../../models/Category";

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        // Only show active categories
        setCategories(res.data.filter((c: Category) => c.active));
      } catch (err) {
         setError("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Core intake</span>
          <h1 className="section-title">Fault report shell</h1>
          <p className="section-copy">
            Select a category from the dropdown to continue with your fault report.
          </p>
        </div>

        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

        <form className="stack-tight">
          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px'}}>
             <label htmlFor="category" style={{fontWeight: 'bold'}}>Category of Malfunction *</label>
             {categories.length === 0 ? (
                <div style={{color: 'red'}}>Error: No active categories available. Cannot submit form.</div>
             ) : (
                <select 
                   id="category"
                   required
                   value={selectedCategory} 
                   onChange={(e) => setSelectedCategory(e.target.value)}
                   style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
                >
                   <option value="" disabled>-- Select a Category --</option>
                   {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                </select>
             )}
          </div>

          <div className="button-row">
            <button type="button" className="button button--solid" disabled={!selectedCategory}>
               Submit Report (Stub)
            </button>
            <Link className="button button--ghost" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}