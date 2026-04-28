"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import Link from 'next/link';
import { api } from "../../lib/api";
import { Category } from "../../models/Category";

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  const allRows = [
    { id: 'INV-1042', title: 'Water leak at downtown branch', priority: 'Hitan', status: 'Open', owner: 'Coordinator A', categoryName: 'Vodovodni kvar' },
    { id: 'INV-1041', title: 'Power outage in office block', priority: 'Visok', status: 'In progress', owner: 'Coordinator B', categoryName: 'Elektricni kvar' },
    { id: 'INV-1039', title: 'Scheduled pump maintenance', priority: 'Normalan', status: 'Open', owner: 'Coordinator A', categoryName: 'Opste odrzavanje' },
  ];

  const rows = selectedCategory === "ALL" 
      ? allRows 
      : allRows.filter((r) => r.categoryName === categories.find(c => c.id.toString() === selectedCategory)?.name);

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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.title}</td>
                  <td>{row.categoryName}</td>
                  <td>
                    <span className={`status-pill status-pill--${row.priority.toLowerCase()}`}>{row.priority}</span>
                  </td>
                  <td>
                    <span className={`status-pill status-pill--${row.status.toLowerCase().replace(' ', '-')}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.owner}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                   <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No interventions match the selected category.</td>
                </tr>
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
