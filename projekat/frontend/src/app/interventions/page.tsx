import Link from 'next/link';

export default function Page() {
  const rows = [
    { id: 'INV-1042', title: 'Water leak at downtown branch', priority: 'Hitan', status: 'Open', owner: 'Coordinator A' },
    { id: 'INV-1041', title: 'Power outage in office block', priority: 'Visok', status: 'In progress', owner: 'Coordinator B' },
    { id: 'INV-1039', title: 'Scheduled pump maintenance', priority: 'Normalan', status: 'Open', owner: 'Coordinator A' },
  ];

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
        <div className="table-toolbar">
          <span className="pill pill--teal">Priority ranking</span>
          <span className="pill pill--warm">Coordinator view</span>
          <span className="pill pill--blue">Filter-ready layout</span>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
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
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}