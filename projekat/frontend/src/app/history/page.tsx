'use client';

import { FormEvent, useState } from 'react';
import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { api } from '@/lib/api';

type InterventionHistoryItem = {
  id: string;
  date: string;
  status: string;
  priority: string;
  location: string;
  categoryId: number;
  categoryName: string;
  summary: string;
  servicer: string;
};

type InterventionHistoryResponse = {
  message: string;
  data: InterventionHistoryItem[];
};

export default function HistoryPage() {
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [items, setItems] = useState<InterventionHistoryItem[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();

      if (location.trim()) {
        params.set('location', location.trim());
      }

      if (categoryId.trim()) {
        params.set('categoryId', categoryId.trim());
      }

      const response = await api.get<InterventionHistoryResponse>(
        `/api/v1/interventions/history?${params.toString()}`,
      );

      setItems(response.data.data);
      setMessage(response.data.message);
    } catch {
      setItems([]);
      setMessage('Historiju intervencija nije moguće dohvatiti. Provjerite filtere i pokušajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Historija intervencija"
        subtitle="Pregled prethodnih završenih ili arhiviranih intervencija po lokaciji i kategoriji kvara."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Historija' }]}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Lokacija
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="npr. Ilidža"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            ID kategorije
            <input
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              placeholder="npr. 2"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? 'Pretraga...' : 'Pretraži historiju'}
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prioritet</th>
              <th className="px-4 py-3">Lokacija</th>
              <th className="px-4 py-3">Kategorija</th>
              <th className="px-4 py-3">Serviser</th>
              <th className="px-4 py-3">Opis</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nema podataka za prikaz.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{new Date(item.date).toLocaleDateString('bs-BA')}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.priority}</td>
                  <td className="px-4 py-3">{item.location}</td>
                  <td className="px-4 py-3">{item.categoryName}</td>
                  <td className="px-4 py-3">{item.servicer}</td>
                  <td className="px-4 py-3">{item.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </PageLayout>
  );
}