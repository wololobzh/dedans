'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Campus, CampusApiError, CampusInput, CampusStatusFilter, createCampus, deactivateCampus, getCampus, listCampuses, updateCampus } from './api';

const emptyForm: CampusInput = { name: '', code: '', city: '', type: 'physical', timezone: 'Europe/Paris' };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function errorText(error: unknown): string {
  if (error instanceof CampusApiError && error.status === 409) return `Opération bloquée : ${error.message}`;
  if (error instanceof CampusApiError && error.status === 503) return 'Le service requis est indisponible, notamment la vérification des dépendances. Réessayez lorsque le service sera prêt.';
  if (error instanceof CampusApiError && error.status === 401) return 'Vous n\'êtes pas authentifié.';
  if (error instanceof CampusApiError && error.status === 403) return "Vous n'avez pas l'autorisation pour cette opération.";
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [status, setStatus] = useState<CampusStatusFilter>('active');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campus | null>(null);
  const [form, setForm] = useState<CampusInput>(emptyForm);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCampuses(status).then((items) => { if (!cancelled) setCampuses(items); }).catch((cause: unknown) => { if (!cancelled) setError(errorText(cause)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status]);

  const visibleCampuses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campuses.filter((campus) => !query || [campus.name, campus.code, campus.city ?? '', campus.type, campus.timezone].some((field) => field.toLowerCase().includes(query)));
  }, [campuses, search]);

  async function selectCampus(id: string): Promise<void> {
    setSelectedId(id); setDetailLoading(true); setError(null);
    try { setSelected(await getCampus(id)); } catch (cause) { setError(errorText(cause)); } finally { setDetailLoading(false); }
  }

  function openCreate(): void { setMode('create'); setForm(emptyForm); setSelected(null); setSelectedId(null); setNotice(null); }
  function openEdit(): void { if (selected) { setMode('edit'); setForm({ name: selected.name, code: selected.code, city: selected.city, type: selected.type, timezone: selected.timezone }); setNotice(null); } }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null);
    try {
      const result = mode === 'create'
        ? await createCampus({ ...form, city: form.type === 'virtual' ? null : form.city?.trim() ?? '' })
        : await updateCampus(selectedId!, { name: form.name, code: form.code, city: form.city?.trim() ?? null });
      setMode(null); setNotice(mode === 'create' ? 'Campus créé.' : 'Campus modifié.');
      setCampuses((current) => mode === 'create' ? [result, ...current] : current.map((campus) => campus.id === result.id ? result : campus));
      await selectCampus(result.id);
    } catch (cause) { setError(errorText(cause)); } finally { setSaving(false); }
  }

  async function submitDeactivation(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!selectedId || !reason.trim()) return;
    setSaving(true); setError(null); setNotice(null);
    try { const result = await deactivateCampus(selectedId, reason); setSelected(result); setCampuses((current) => current.map((campus) => campus.id === result.id ? result : campus)); setReason(''); setNotice('Campus désactivé.'); if (status === 'active') setCampuses((current) => current.filter((campus) => campus.id !== result.id)); } catch (cause) { setError(errorText(cause)); } finally { setSaving(false); }
  }

  return (
    <main className="campusShell">
      <header className="pageHeader">
        <div><a className="backLink" href="/">← Tableau de bord</a><p className="eyebrow">Référentiel opérationnel</p><h1>Campus</h1><p className="intro">Consultez les sites autorisés et maintenez leur cycle de vie.</p></div>
        <button className="button buttonPrimary" onClick={openCreate}>Nouveau campus</button>
      </header>

      {error && <div className="alert alertError" role="alert"><strong>Action impossible</strong><span>{error}</span></div>}
      {notice && <div className="alert alertSuccess" role="status">{notice}</div>}

      <section className="toolbar" aria-label="Filtres des campus">
        <label className="searchField">Rechercher<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, code ou ville" /></label>
        <label>Statut<select value={status} onChange={(event) => setStatus(event.target.value as CampusStatusFilter)}><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="all">Tous</option></select></label>
        <span className="resultCount">{visibleCampuses.length} résultat{visibleCampuses.length === 1 ? '' : 's'}</span>
      </section>

      <div className="campusLayout">
        <section className="listPanel" aria-label="Liste des campus">
          {loading ? <p className="state">Chargement des campus...</p> : visibleCampuses.length === 0 ? <div className="state"><strong>{search ? 'Aucun résultat' : 'Aucun campus dans cette vue'}</strong><span>{search ? 'Modifiez votre recherche.' : 'Changez le filtre ou créez un campus.'}</span></div> : <div className="campusList">{visibleCampuses.map((campus) => <button className={`campusRow ${selectedId === campus.id ? 'campusRowSelected' : ''}`} key={campus.id} onClick={() => void selectCampus(campus.id)}><span><strong>{campus.name}</strong><small>{campus.code} · {campus.type === 'physical' ? 'Physique' : 'Virtuel'} · {campus.city ?? 'À distance'} · {campus.timezone}</small></span><span className={`badge badge${campus.status === 'active' ? 'Active' : 'Inactive'}`}>{campus.status === 'active' ? 'Actif' : 'Inactif'}</span></button>)}</div>}
        </section>

        <aside className="detailPanel" aria-live="polite">
          {detailLoading ? <p className="state">Chargement du détail...</p> : selected ? <><div className="detailHeading"><div><p className="eyebrow">Fiche campus</p><h2>{selected.name}</h2></div><span className={`badge badge${selected.status === 'active' ? 'Active' : 'Inactive'}`}>{selected.status === 'active' ? 'Actif' : 'Inactif'}</span></div><dl className="detailGrid"><div><dt>Code</dt><dd>{selected.code}</dd></div><div><dt>Type</dt><dd>{selected.type === 'physical' ? 'Physique' : 'Virtuel'}</dd></div><div><dt>Fuseau horaire</dt><dd>{selected.timezone}</dd></div><div><dt>Localisation</dt><dd>{selected.city ?? 'Campus virtuel, sans ville'}</dd></div><div><dt>Créé le</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt>Mis à jour le</dt><dd>{formatDate(selected.updatedAt)}</dd></div></dl>{selected.deactivationReason && <div className="deactivationInfo"><dt>Motif de désactivation</dt><p>{selected.deactivationReason}</p></div>}<div className="detailActions">{selected.status === 'active' && <><button className="button" onClick={openEdit}>Modifier</button><form className="deactivateForm" onSubmit={(event) => void submitDeactivation(event)}><label>Motif obligatoire<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required placeholder="Pourquoi désactiver ce campus ?" /></label><button className="button buttonDanger" disabled={saving || !reason.trim()}>Désactiver</button></form></>}</div></> : <div className="state"><strong>Sélectionnez un campus</strong><span>Les informations détaillées apparaîtront ici.</span></div>}
        </aside>
      </div>

      {mode && <div className="modalBackdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="campusFormTitle"><div className="modalHeader"><div><p className="eyebrow">{mode === 'create' ? 'Nouveau référentiel' : 'Mise à jour'}</p><h2 id="campusFormTitle">{mode === 'create' ? 'Créer un campus' : 'Modifier le campus'}</h2></div><button className="closeButton" onClick={() => setMode(null)} aria-label="Fermer">×</button></div><form onSubmit={(event) => void submit(event)}><label>Nom officiel<input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Code<input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label><label>Ville {form.type === 'physical' ? '(obligatoire)' : '(facultative)'}<input required={form.type === 'physical'} maxLength={200} value={form.city ?? ''} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>Type{mode === 'create' ? <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CampusInput['type'], city: event.target.value === 'virtual' ? null : form.city ?? '' })}><option value="physical">Physique</option><option value="virtual">Virtuel</option></select> : <input value={form.type === 'physical' ? 'Physique' : 'Virtuel'} readOnly aria-readonly="true" />}</label><label>Fuseau horaire IANA<input required maxLength={100} value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} readOnly={mode === 'edit'} aria-readonly={mode === 'edit'} placeholder="Europe/Paris" /></label><div className="formActions"><button className="button" type="button" onClick={() => setMode(null)}>Annuler</button><button className="button buttonPrimary" disabled={saving}>{saving ? 'Enregistrement...' : mode === 'create' ? 'Créer le campus' : 'Enregistrer'}</button></div></form></section></div>}
    </main>
  );
}