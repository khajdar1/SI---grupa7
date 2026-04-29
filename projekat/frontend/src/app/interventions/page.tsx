"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { api } from "../../lib/api";
import { Category } from "../../models/Category";

type Intervention = {
  id: number;
  name: string;
  description: string;
  priority: string;
  status: string;
  category: {
    id: number;
    name: string;
  };
  company: {
    id: number;
    name: string;
  };
  createdAt: string;
};

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, interventionsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/interventions"),
        ]);
        setCategories(categoriesRes.data);
        setInterventions(interventionsRes.data);
      } catch (err) {
        console.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows = selectedCategory === "ALL" 
      ? interventions
      : interventions.filter((i) => i.category.id.toString() === selectedCategory);

  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Core workflow</span>
        <h1 className="section-title">Interventions shell</h1>
        <p className="section-copy">
          This route will eventually provide prioritised lists, filters, and a direct entry point into status updates
          and assignment actions.
        </p>
      </section>

      <article className="panel stack-tight">
        <div className="table-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="pill pill--teal">Priority ranking</span>
          <span className="pill pill--warm">Coordinator view</span>
          <span className="pill pill--blue">Filter-ready layout</span>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
             <label htmlFor="categoryFilter" style={{ fontWeight: 'bold' }}>Filter by Category:</label>
             <select 
               id="categoryFilter"
               value={selectedCategory} 
               onChange={(e) => setSelectedCategory(e.target.value)}
               style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
             >
               <option value="ALL">All Categories</option>
               {categories.map((c) => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Učitavanje intervencija...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Nema intervencija.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>INT-{String(row.id).padStart(5, '0')}</td>
                    <td>{row.name}</td>
                    <td>{row.category.name}</td>
                    <td>
                      <span className={`status-pill status-pill--${row.priority.toLowerCase()}`}>{row.priority}</span>
                    </td>
                    <td>
                      <span className={`status-pill status-pill--${row.status.toLowerCase().replace(' ', '-')}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.company.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
      
      <div className="button-row" style={{marginTop: '20px'}}>
        <Link className="button button--ghost" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
