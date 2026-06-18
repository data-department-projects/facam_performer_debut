# UI Tokens — FACAM PERFORMER

Design tokens pour FACAM PERFORMER. Toutes les couleurs, typographies, espacements et valeurs de composants proviennent de la charte graphique FACAM STAIRWAY, étendue des tokens nécessaires à l'application. Utiliser ces valeurs exactes partout dans le code — jamais de couleur en dur, jamais de classe Tailwind couleur brute dans les composants.

---

## How to Use

Ce projet utilise **Tailwind CSS v4**. Tous les tokens de design sont définis via la directive `@theme` dans `app/globals.css`. Aucun `tailwind.config.ts` nécessaire pour les couleurs ou tokens.

Tailwind v4 génère automatiquement des classes utilitaires à partir des variables `@theme` :

- `--color-facamBlue` → `bg-facamBlue`, `text-facamBlue`, `border-facamBlue`
- `--color-gray500` → `bg-gray500`, `text-gray500`, `border-gray500`

```tsx
// Correct — utilise les classes utilitaires générées
className="bg-facamBlue text-facamWhite border-gray200"

// Aussi correct — référence directe à la variable CSS
style={{ color: 'var(--facam-blue)' }}

// Jamais — valeurs hex en dur
className="bg-[#001b61] text-[#000000]"

// Jamais — classes couleur Tailwind brutes
className="bg-blue-900 text-gray-600"
```

**Les cinq tokens de charte officielle (`facamBlue`, `facamDark`, `facamYellow`, `facamWhite`, `facamBlack`) ne sont jamais modifiés.** Tous les autres tokens ci-dessous sont des ajouts applicatifs propres à FACAM PERFORMER.

---

## globals.css — Définition Complète des Tokens

```css
@theme {
  /* — Charte officielle FACAM STAIRWAY, ne pas modifier — */
  --color-facamBlue: #001b61;
  --color-facamDark: #000d32;
  --color-facamYellow: #ffae03;
  --color-facamWhite: #ffffff;
  --color-facamBlack: #000000;

  /* — Ajouts FACAM PERFORMER : variantes de bleu — */
  --color-facamBlueMid: #002a6e;
  --color-facamBlueTint: #f0f4fa;

  /* — Ajouts FACAM PERFORMER : statuts sémantiques — */
  --color-success: #16a34a;
  --color-successLight: #dcfce7;
  --color-warning: #92600a;
  --color-warningLight: rgba(255, 174, 3, 0.12); /* dérivé de facamYellow */
  --color-error: #b91c1c;
  --color-errorLight: #fee2e2;
  --color-info: #001b61; /* alias sémantique de facamBlue */
  --color-infoLight: #f0f4fa; /* alias sémantique de facamBlueTint */

  /* — Ajouts FACAM PERFORMER : échelle de gris — */
  --color-gray50: #f9fafb;
  --color-gray100: #f3f4f6;
  --color-gray200: #e5e7eb;
  --color-gray300: #d1d5db;
  --color-gray400: #9ca3af;
  --color-gray500: #6b7280;
  --color-gray600: #4b5563;
  --color-gray700: #374151;
  --color-gray800: #1f2937;
  --color-gray900: #111827;

  /* — Border radius — */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

`--font-montserrat` et `--font-blacksword` restent déclarées dans `:root` (hors `@theme`, déjà en place). Seule `--font-montserrat` est utilisée dans FACAM PERFORMER.

---

## Color Usage Guide

### Page Layout

| Élément | Token |
| --- | --- |
| Fond de zone de contenu | `bg-facamBlueTint` |
| Card / surface | `bg-facamWhite` |
| Sidebar | `bg-facamBlue` |
| Item de sidebar actif | `bg-facamBlueMid` |
| Bordure par défaut | `border-gray200` |
| Bordure de champ | `border-gray300` |

### Typographie

| Élément | Token |
| --- | --- |
| Titres, texte principal | `text-facamDark` |
| Corps de texte | `text-facamBlack` |
| Texte secondaire, labels | `text-gray500` |
| Placeholder, atténué | `text-gray400` |
| Texte sur fond sombre (sidebar) | `text-facamWhite` |

### Bleu (Couleur de Marque Primaire)

Utilisé pour : sidebar, boutons primaires, item de navigation actif, anneaux de focus, statut "Débuté"/"Soumis"

| Élément | Token |
| --- | --- |
| Fond bouton primaire | `bg-facamBlue` |
| Hover bouton primaire | `bg-facamDark` |
| Fond sidebar | `bg-facamBlue` |
| Fond item actif sidebar | `bg-facamBlueMid` |
| Fond léger (badges info) | `bg-facamBlueTint` |

### Jaune (Accent)

Utilisé pour : bouton accent (actions positives fortes), indicateur actif sidebar, statut "En cours"/risque modéré

| Élément | Token |
| --- | --- |
| Fond bouton accent | `bg-facamYellow` |
| Texte sur bouton accent | `text-facamDark` |
| Bordure indicateur actif sidebar | `border-facamYellow` |
| Fond léger badge "En cours" | `bg-warningLight` |

### Statuts Sémantiques

| Statut | Token fond | Token texte |
| --- | --- | --- |
| Succès / Validé / Terminé | `bg-successLight` | `text-success` |
| Avertissement / Risque | `bg-warningLight` | `text-warning` |
| Erreur / Non terminé / Rejeté | `bg-errorLight` | `text-error` |
| Information / Débuté / Soumis | `bg-facamBlueTint` | `text-facamBlue` |

---

## Statuts de Tâche (Week Planner)

| Statut | Background | Texte |
| --- | --- | --- |
| Débuté | `bg-facamBlueTint` | `text-facamBlue` |
| En cours | `bg-warningLight` | `text-warning` |
| Terminé | `bg-successLight` | `text-success` |
| Non terminé | `bg-errorLight` | `text-error` |

## Statuts de Projet

| Statut | Background | Texte |
| --- | --- | --- |
| Brouillon | `bg-gray100` | `text-gray600` |
| Soumis | `bg-facamBlueTint` | `text-facamBlue` |
| Validé | `bg-successLight` | `text-success` |
| Rejeté | `bg-errorLight` | `text-error` |

## Seuils de Charge ETP / Avancement Projet

| Plage | Couleur | Token |
| --- | --- | --- |
| Normal (avancement à temps, charge ≤ 80%) | Bleu | `bg-facamBlue` |
| Risque (charge 80–95%) | Jaune | `bg-facamYellow` |
| Surcharge / Retard (charge > 95% ou échéance dépassée) | Rouge | `bg-error` |

---

## Typography

| Élément | Taille | Poids | Line-height | Token couleur |
| --- | --- | --- | --- | --- |
| Logo / titre app | 19px | 700 | 28px | `text-facamDark` |
| Chiffre KPI (dashboard) | 30px | 600 | 36px | `text-facamDark` |
| Titre de section / card | 16px | 600 | 24px | `text-facamDark` |
| Item nav sidebar (actif) | 14px | 500 | 20px | `text-facamWhite` |
| Item nav sidebar (inactif) | 14px | 500 | 20px | `text-facamWhite` (70% opacité) |
| Label de card | 14px | 500 | 20px | `text-gray500` |
| Corps de texte / activité | 14px | 500 | 20px | `text-facamBlack` |
| Badge de tendance | 12px | 500 | 16px | `text-success` |
| Timestamp / texte atténué | 12px | 400 | 16px | `text-gray400` |
| Labels d'axe de graphique | 12px | 400 | 15px | `#9CA3AF` |
| Sous-titre de stat | 12px | 400 | 16px | `text-gray500` |

Famille de police : **Montserrat** — import via `next/font/google`. Jamais de police système en fallback principal.

---

## Spacing

| Token | Valeur | Usage |
| --- | --- | --- |
| `gap-1` | 4px | Espacements inline serrés |
| `gap-2` | 8px | Espacement badges et tags |
| `gap-3` | 12px | Espacement champs de formulaire |
| `gap-4` | 16px | Espacement interne de section |
| `gap-6` | 24px | Entre sections |
| `gap-8` | 32px | Espacement de section de page |
| `p-4` | 16px | Padding de card compacte |
| `p-6` | 24px | Padding de card standard |
| `px-4 py-2` | 16px / 8px | Padding bouton |
| `px-2 py-0.5` | 8px / 2px | Padding badge |

---

## Component Tokens

### Sidebar

```
background: bg-facamBlue
width: 260px
logo zone: h-16, border-b border-white/10
item: px-5 py-2.5, text-facamWhite/70, text-sm font-medium
item hover: bg-white/5, text-facamWhite
item actif: bg-facamBlueMid, text-facamWhite, border-l-[3px] border-facamYellow
section label: text-[10px] font-semibold uppercase tracking-widest text-facamWhite/40
```

### Cards

```
background: bg-facamWhite
border: 1px solid var(--gray-200) (border-gray200)
border-radius: 16px (rounded-xl)
padding: 24px (p-6)
box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)
```

### Buttons

**Primaire :**

```
background: bg-facamBlue
text: text-facamWhite
border-radius: rounded-md (8px)
padding: px-4 py-2
font-weight: font-semibold
hover: bg-facamDark
```

**Secondaire :**

```
background: bg-facamWhite
border: border border-gray300
text: text-facamDark
border-radius: rounded-md (8px)
padding: px-4 py-2
hover: bg-gray50
```

**Accent :**

```
background: bg-facamYellow
text: text-facamDark
border-radius: rounded-md (8px)
padding: px-4 py-2
font-weight: font-semibold
hover: filter brightness(1.05)
```

**Ghost :**

```
background: transparent
text: text-gray500
hover: hover:bg-gray50
border-radius: rounded-md
```

### Input Fields

```
background: bg-facamWhite
border: border border-gray300
border-radius: rounded-md (8px)
padding: px-3 py-2
text: text-facamBlack
placeholder: text-gray400
focus: ring-2 ring-facamBlue/20 border-facamBlue
```

### Badges

```
border-radius: rounded-full
padding: px-2 py-0.5
font-size: text-xs
font-weight: font-medium
```

### Tables

```
header: text-[10px] uppercase tracking-widest text-gray500
row border: border-b border-gray200
row hover: bg-gray50
cell text: text-sm text-facamBlack
```

### Barres de Progression

```
background track: bg-gray200
fill: selon contexte (voir Seuils de Charge ETP / Avancement Projet ci-dessus)
height: 6px
border-radius: rounded-full
```

### Indicateurs de Charge / Anneau de Complétion

```
ring background: stroke var(--gray-200)
ring fill: stroke var(--facam-blue) (ou facamYellow / error selon seuil)
stroke-width: 7
```

### Avatar / Badge de Rôle (sidebar)

```
avatar: w-8 h-8 rounded-full bg-facamBlueMid text-facamWhite text-xs font-semibold (initiales)
role badge — Admin: bg-facamYellow text-facamDark
role badge — Manager: bg-facamBlueTint text-facamBlue
role badge — Collaborateur: bg-gray100 text-gray600
```

### Dashboard Chart Colors

| Graphique | Couleur |
| --- | --- |
| Taux d'exécution des tâches (bar) | `#001b61` (facamBlue) |
| Avancement des projets (line) | `#002a6e` (facamBlueMid), trait 2.5px |
| Charge de travail par équipe (bar) | `#ffae03` (facamYellow) |
| Distribution des statuts (bar empilée) | success / warning / error tokens |
| Grille de graphique | `1px dashed #e5e7eb` (gray200) |
| Labels d'axe | `#9ca3af`, 12px |

---

## Invariants

- Jamais de valeur hex directement dans les composants — toujours via les tokens Tailwind générés depuis `@theme`
- Police : Montserrat uniquement — toujours via `next/font/google`, jamais de police système en fallback. Blacksword n'est jamais utilisé dans FACAM PERFORMER
- Jamais de classes Tailwind couleur brutes (`bg-blue-900`, `text-gray-600`) — utiliser uniquement les tokens du projet
- `facamBlue` (#001b61) est le seul bleu de marque — jamais une autre teinte de bleu hors `facamBlueMid`/`facamBlueTint` qui en sont des dérivés déclarés
- `facamYellow` (#ffae03) est réservé à l'accent et aux indicateurs actifs — jamais utilisé comme couleur de fond de page
- Les couleurs de statut (success/warning/error/info) sont toujours utilisées via leurs tokens dédiés — jamais une couleur de statut codée en dur même si elle ressemble visuellement à un token existant
- Toutes les bordures par défaut utilisent `border-gray200` — jamais `border-gray-*` (classe Tailwind brute)
- Les cinq tokens de charte officielle restent inchangés en toute circonstance — toute nouvelle couleur de marque doit être validée avec l'équipe FACAM avant d'être ajoutée ici
