'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './learner.module.css';

interface ProgramVersion {
  id: string;
  version: string;
  program?: {
    name: string;
  };
}

interface EnrollmentProgram {
  id: string;
  sequence: number;
  status: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  programVersion?: ProgramVersion;
}

interface StatusHistory {
  status: string;
  effectiveAt: string;
  reason?: string;
}

interface Enrollment {
  id: string;
  status: string;
  cohort?: {
    code: string;
    campus?: {
      name: string;
    };
  };
  entryType: string;
  fundingType: string;
  startDate: string;
  expectedEndDate?: string;
  enrollmentPrograms: EnrollmentProgram[];
  statusHistory: StatusHistory[];
}

interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  enrollments: Enrollment[];
}

export default function LearnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLearner();
  }, [params.id]);

  const fetchLearner = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/learners/${params.id}`, {
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to fetch learner');
      const data = await response.json();
      setLearner(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <main className={styles.container}><p>Chargement...</p></main>;
  if (error) return <main className={styles.container}><p className={styles.error}>Erreur: {error}</p></main>;
  if (!learner) return <main className={styles.container}><p>Apprenant non trouvé</p></main>;

  const activeEnrollment = learner.enrollments[0];
  const activeProgram = activeEnrollment?.enrollmentPrograms[0];

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link href="/apprenants" className={styles.back}>
          ← Retour
        </Link>
        <h1>{learner.firstName} {learner.lastName}</h1>
      </div>

      <div className={styles.grid}>
        {/* Identity Section */}
        <section className={styles.card}>
          <h2>Identité</h2>
          <div className={styles.info}>
            <div>
              <label>Nom</label>
              <p>{learner.lastName}</p>
            </div>
            <div>
              <label>Prénom</label>
              <p>{learner.firstName}</p>
            </div>
            {learner.preferredName && (
              <div>
                <label>Prénom d'usage</label>
                <p>{learner.preferredName}</p>
              </div>
            )}
            {learner.email && (
              <div>
                <label>Email</label>
                <p>{learner.email}</p>
              </div>
            )}
            {learner.phone && (
              <div>
                <label>Téléphone</label>
                <p>{learner.phone}</p>
              </div>
            )}
            {learner.birthDate && (
              <div>
                <label>Date de naissance</label>
                <p>{new Date(learner.birthDate).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Current Enrollment Section */}
        {activeEnrollment && (
          <section className={styles.card}>
            <h2>Inscription actuelle</h2>
            <div className={styles.info}>
              <div>
                <label>Campus</label>
                <p>{activeEnrollment.cohort?.campus?.name || '—'}</p>
              </div>
              <div>
                <label>Cohorte</label>
                <p>{activeEnrollment.cohort?.code || '—'}</p>
              </div>
              <div>
                <label>Statut</label>
                <p>{activeEnrollment.status}</p>
              </div>
              <div>
                <label>Date de début</label>
                <p>{new Date(activeEnrollment.startDate).toLocaleDateString('fr-FR')}</p>
              </div>
              {activeEnrollment.expectedEndDate && (
                <div>
                  <label>Date de fin prévue</label>
                  <p>{new Date(activeEnrollment.expectedEndDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              <div>
                <label>Type d'entrée</label>
                <p>{activeEnrollment.entryType}</p>
              </div>
              <div>
                <label>Financement</label>
                <p>{activeEnrollment.fundingType}</p>
              </div>
            </div>
          </section>
        )}

        {/* Current Program Section */}
        {activeProgram && (
          <section className={styles.card}>
            <h2>Programme actuel</h2>
            <div className={styles.info}>
              <div>
                <label>Programme</label>
                <p>{activeProgram.programVersion?.program?.name || '—'}</p>
              </div>
              <div>
                <label>Version</label>
                <p>{activeProgram.programVersion?.version || '—'}</p>
              </div>
              <div>
                <label>Statut</label>
                <p>{activeProgram.status}</p>
              </div>
              <div>
                <label>Date de début</label>
                <p>{new Date(activeProgram.startDate).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Training Path Section */}
      {activeEnrollment && activeEnrollment.enrollmentPrograms.length > 0 && (
        <section className={styles.card}>
          <h2>Parcours de formation</h2>
          <div className={styles.timeline}>
            {activeEnrollment.enrollmentPrograms.map((program, index) => (
              <div key={program.id} className={styles.timelineItem}>
                <div className={styles.timelineDot}>
                  {program.status === 'completed' ? '✓' : '→'}
                </div>
                <div className={styles.timelineContent}>
                  <p className={styles.timelineTitle}>
                    {program.programVersion?.program?.name} {program.programVersion?.version}
                  </p>
                  <p className={styles.timelineStatus}>{program.status}</p>
                  <p className={styles.timelineDate}>
                    {new Date(program.startDate).toLocaleDateString('fr-FR')}
                    {program.actualEndDate && ` → ${new Date(program.actualEndDate).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Enrollment History Section */}
      {activeEnrollment && activeEnrollment.statusHistory && activeEnrollment.statusHistory.length > 0 && (
        <section className={styles.card}>
          <h2>Historique d'inscription</h2>
          <div className={styles.history}>
            {activeEnrollment.statusHistory.map((entry, index) => (
              <div key={index} className={styles.historyItem}>
                <p className={styles.historyDate}>
                  {new Date(entry.effectiveAt).toLocaleDateString('fr-FR')}
                </p>
                <p className={styles.historyStatus}>{entry.status}</p>
                {entry.reason && <p className={styles.historyReason}>{entry.reason}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button onClick={() => router.back()} className={styles.buttonSecondary}>
          Modifier
        </button>
        <button onClick={() => router.back()} className={styles.buttonSecondary}>
          Ajouter une formation
        </button>
      </div>
    </main>
  );
}
