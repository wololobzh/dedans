type ApiHealth = {
  status: string;
  service: string;
  timestamp: string;
};

async function readApiHealth(): Promise<ApiHealth | null> {
  const apiUrl = process.env.INTERNAL_API_URL ?? 'http://api:3001';

  try {
    const response = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as ApiHealth;
  } catch {
    return null;
  }
}

const metrics = [
  ['Apprenants actifs', '—'],
  ['Promotions actives', '—'],
  ['SWE actifs', '—'],
  ['Ratio apprenants / SWE', '—'],
];

export default async function HomePage() {
  const apiHealth = await readApiHealth();

  return (
    <main>
      <p className="eyebrow">School ERP</p>
      <h1>Tableau de bord national</h1>
      <p className="intro">
        Starter Docker-first prêt pour construire l&apos;ERP avec les agents GitHub Copilot de développement.
      </p>

      <div className={`status ${apiHealth ? 'statusOk' : 'statusError'}`}>
        <span className="statusDot" />
        API {apiHealth ? 'connectée' : 'indisponible'}
      </div>

      <section className="grid">
        {metrics.map(([label, value]) => (
          <article className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="next">
        <h2>Première feature recommandée</h2>
        <p>Le répertoire des campus est prêt pour les opérations de consultation et de gestion.</p>
        <a className="button buttonPrimary" href="/campuses">Ouvrir la gestion des campus</a>
      </section>
    </main>
  );
}
