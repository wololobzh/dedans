'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  campus?: string;
  cohort?: string;
  currentProgram?: string;
  enrollmentStatus?: string;
}

interface ListResponse {
  learners: Learner[];
  total: number;
}

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchLearners();
  }, [search, campusFilter, cohortFilter, statusFilter, skip]);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: skip.toString(),
        take: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (campusFilter) params.append('campusId', campusFilter);
      if (cohortFilter) params.append('cohortId', cohortFilter);
      if (statusFilter) params.append('status', statusFilter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/learners?${params}`, {
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to fetch learners');

      const data: ListResponse = await response.json();
      setLearners(data.learners);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>Apprenants</h1>
        <Link href="/apprenants/new" className={styles.button}>
          + Créer un apprenant
        </Link>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSkip(0);
          }}
          className={styles.searchInput}
        />

        <select
          value={campusFilter}
          onChange={(e) => {
            setCampusFilter(e.target.value);
            setSkip(0);
          }}
          className={styles.select}
        >
          <option value="">Tous les campus</option>
          {/* Campus options will be populated dynamically */}
        </select>

        <select
          value={cohortFilter}
          onChange={(e) => {
            setCohortFilter(e.target.value);
            setSkip(0);
          }}
          className={styles.select}
        >
          <option value="">Toutes les cohortes</option>
          {/* Cohort options will be populated dynamically */}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSkip(0);
          }}
          className={styles.select}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="completed">Terminé</option>
          <option value="suspended">Suspendu</option>
          <option value="withdrawn">Retiré</option>
        </select>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className={styles.error}>Erreur: {error}</p>}

      {!loading && learners.length === 0 && <p>Aucun apprenant trouvé</p>}

      {!loading && learners.length > 0 && (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Campus</th>
                <th>Cohorte</th>
                <th>Programme actuel</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner) => (
                <tr key={learner.id}>
                  <td>{learner.lastName}</td>
                  <td>{learner.firstName}</td>
                  <td>{learner.email || '—'}</td>
                  <td>{learner.campus || '—'}</td>
                  <td>{learner.cohort || '—'}</td>
                  <td>{learner.currentProgram || '—'}</td>
                  <td>{learner.enrollmentStatus || '—'}</td>
                  <td>
                    <Link href={`/apprenants/${learner.id}`} className={styles.link}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <button
          onClick={() => setSkip(Math.max(0, skip - pageSize))}
          disabled={skip === 0}
        >
          Précédent
        </button>
        <span>
          Page {Math.floor(skip / pageSize) + 1} sur {Math.ceil(total / pageSize)}
        </span>
        <button
          onClick={() => setSkip(skip + pageSize)}
          disabled={skip + pageSize >= total}
        >
          Suivant
        </button>
      </div>
    </main>
  );
}
