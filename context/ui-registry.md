# UI Registry — FACAM PERFORMER

Living document. Mis à jour après chaque composant construit. Lire ce fichier avant de construire tout nouveau composant — reproduire exactement les patterns existants avant d'en inventer de nouveaux.

Ce fichier démarre vide : aucun composant n'a encore été construit (voir progress-tracker.md). Chaque section ci-dessous correspond à un module du build-plan et sera complétée au moment où le composant correspondant est effectivement implémenté — jamais avant.

---

## How to Use

Avant de construire un composant :

1. Vérifier si un composant similaire existe déjà ici
2. Si oui — reproduire exactement ses classes
3. Si non — le construire en suivant ui-rules.md et ui-tokens.md, puis l'ajouter ici

Après avoir construit un composant — mettre à jour ce fichier avec le nom du composant, le chemin du fichier, et les classes exactes utilisées.

Ne jamais documenter ici un composant qui n'a pas encore été codé — ce fichier reflète l'état réel du code, pas le plan.

---

## Components

### Layout

_Navbar marketing (page d'accueil), AppNavbar (interface authentifiée), Footer — à documenter à la Phase 1 (Feature 01)._

---

### Authentification

_Page de connexion, formulaire mot de passe oublié — à documenter à la Phase 1 (Feature 01)._

---

### App Shell

_Container de page authentifiée, sidebar de navigation par rôle (Admin / Manager / Collaborateur) si applicable — à documenter à la Phase 1._

---

### App Cards & Containers

_Card générique, bannière d'alerte/avertissement (ex. profil incomplet, semaine non validée) — premier composant probable à la Phase 5 ou Phase 9, à réutiliser partout ensuite._

---

### Form Primitives

_Field Label, Text Input, Select Input, Textarea, Checkbox, Date Picker — premiers composants probables à la Phase 2 (Organigramme) ou Phase 5 (Week Planner)._

---

### Tag / Pill Badges

_Badges de statut de tâche (Débuté / En cours / Terminé / Non terminé), badges de rôle, badges de statut de projet (Brouillon / Soumis / Validé / Rejeté) — à documenter à la Phase 4 ou 5._

---

### Organigramme

_Vue arborescente Départements → Sous-départements → Équipes, fiche détail d'un nœud — à documenter à la Phase 2 (Feature 06)._

---

### Administration

_Tableau liste des utilisateurs, formulaire création/édition utilisateur, écran de configuration des permissions — à documenter à la Phase 3 (Feature 08)._

---

### Projets & Gantt

_Liste des projets, formulaire création de projet, vue Gantt (gantt-task-react), zone d'import Excel, vue Collaborateur "Mes tâches assignées" (mise à jour d'avancement uniquement) — à documenter à la Phase 4._

---

### Comités

_Calendrier des réunions, liste des actions décidées, formulaire de création de comité (départements/participants/invités), formulaire de planification de réunion, vue Collaborateur "Mes Comités" (lecture seule) — à documenter à la Phase 4._

---

### Notifications

_Bandeau de consentement aux notifications push (NotificationPermissionPrompt) — à documenter à la Phase 1 (Feature 06)._

---

### Week Planner

_Vue planification de la semaine, vue exécution quotidienne, sélecteur de statut de tâche avec commentaire obligatoire conditionnel — à documenter à la Phase 5 (Feature 15)._

---

### Suivi ETP & Temps

_Tableau consolidé du temps déclaré, indicateur de charge ETP, boutons d'export PDF/CSV — à documenter à la Phase 6 (Feature 19)._

---

### Objectifs

_Formulaire de définition d'objectif (fréquence configurable), vue de suivi personnel, vue de consolidation département — à documenter à la Phase 7 (Feature 21)._

---

### Actions à traiter

**Feature 28 — implémentée (2026-06-23)**

| Composant | Chemin | Rôle |
|---|---|---|
| `ActionsToProcessView` | `components/actions-to-process/ActionsToProcessView.tsx` | Client Component — tabs shadcn/ui, routing conditionnel Admin/Manager |
| `ProjectConfirmCard` | `components/actions-to-process/ProjectConfirmCard.tsx` | Card projet en attente de confirmation (Admin only) |
| `WeekPlannerValidateCard` | `components/actions-to-process/WeekPlannerValidateCard.tsx` | Card week planner soumis à valider (Manager) |
| `CommitteeActionOverdueCard` | `components/actions-to-process/CommitteeActionOverdueCard.tsx` | Card action comité en retard avec badge rouge |

**Patterns clés :**
- Tabs : `<Tabs defaultValue={...}><TabsList><TabsTrigger>` avec badge compteur inline dans le label
- Badge compteur actif tab : `rounded-full bg-[--color-facamBlue] px-1.5 py-0.5 text-xs font-medium text-white`
- Badge erreur (retard) : `rounded-full bg-[--color-error] px-1.5 py-0.5 text-xs font-medium text-white`
- Card layout : `flex items-center justify-between rounded-[--radius-xl] border border-[--color-gray-200] bg-white p-5 shadow-sm`
- Icône container : `flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[--radius-lg] bg-[--color-facamBlueTint]`
- Empty state : `<CheckCircle2>` lucide centré + texte `text-[--color-gray-400]`
- Bouton CTA card : outline, `border border-[--color-gray-200] text-[--color-facamBlue] hover:bg-[--color-facamBlueTint]`
- Mock data scopée : Admin reçoit 3 catégories, Manager reçoit 2 (pendingProjects toujours vide)

---

### Tableau de bord

_Cartes KPI, liste d'activité récente, graphiques recharts (taux d'exécution, charge par équipe, avancement projets) — à documenter à la Phase 9 (Feature 26)._

---

### Accueil / Guide / Support

_Page FAQ statique, formulaire de remontée de bug — à documenter à la Phase 10 (Feature 28)._

---

### Buttons

_Bouton primaire pleine largeur, CTA inline, bouton secondaire outline — premier bouton réel probable dès la Phase 1 (connexion), à figer ici dès sa première implémentation pour être réutilisé partout ensuite._

---

## Notes

_Consigner ici tout écart entre un composant prévu et son implémentation réelle, ou toute décision de design prise en cours de build qui mérite d'être visible pour les sessions futures._
