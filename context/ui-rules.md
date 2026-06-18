# UI Rules — FACAM PERFORMER

Règles concises pour construire l'UI de FACAM PERFORMER. La charte graphique FACAM STAIRWAY (globals.css) est la source de vérité pour les couleurs et polices — ces règles couvrent les patterns et contraintes les plus importants pour garder l'UI cohérente sans tout sur-spécifier.

**Ne jamais modifier les couleurs ou polices de la charte officielle** (`--facam-blue`, `--facam-dark`, `--facam-yellow`, `--facam-white`, `--facam-black`, Montserrat, Blacksword). Les tokens additionnels nécessaires à l'application (voir section Tailwind v4) sont des ajouts, jamais des remplacements.

---

## Police

Montserrat uniquement dans FACAM PERFORMER — c'est un outil interne, pas une page marketing. **Blacksword (décoratif) n'est jamais utilisé dans cette application**, il reste réservé aux pages publiques Rejoindre/Carrières.

```typescript
import { Montserrat } from "next/font/google";
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "500", "600", "700"] });
```

`--font-montserrat` est déjà déclarée dans `:root` (globals.css). Appliquer la classe de variable de police à la balise `<html>` du layout racine. Titres toujours en poids 600–700, jamais en 400 ou 500.

---

## Layout & App Shell

- Sidebar latérale fixe à gauche, 260px de large, hauteur 100vh
- Zone de contenu principal : padding 32px sur tous les côtés, fond `--facam-blue-tint` (#f0f4fa)
- Gap entre sections d'une page : 24px
- Barre supérieure légère dans la zone de contenu (pas une navbar complète) : 56px de haut, fond blanc, titre de page + actions utilisateur (notifications, menu profil) à droite
- Pas de navbar horizontale pleine largeur comme sur les pages marketing — la sidebar est la seule navigation primaire

---

## Sidebar — Navigation par rôle

```
sidebar background:  var(--facam-blue) — #001b61
logo zone:            h-16, padding 0 20px, border-b border-white/10
nav item (défaut):    flex items-center gap-3, px-5 py-2.5, text-white/70, text-sm font-medium
nav item (hover):     bg-white/5, text-white
nav item (actif):     bg-[var(--facam-blue-mid)], text-white, border-l-[3px] border-[var(--facam-yellow)]
nav icon:             w-4.5 h-4.5, currentColor
section label:        text-[10px] font-semibold uppercase tracking-widest text-white/40, px-5, mt-6 mb-2
user zone (bas):      border-t border-white/10, px-5 py-4, avatar + nom + badge de rôle
```

**Menu par rôle (filtré côté serveur, jamais seulement masqué côté client) :**

- **Administrateur** — Tableau de bord, Organigramme, Projets & Comités, Suivi ETP & Temps, Objectifs Départements, Administration, Actions à traiter, Guide/Bugs
- **Manager** — Tableau de bord, Organigramme (consultation), Projets & Comités, Week Planner (validation équipe), Objectifs, Actions à traiter (flux équipe), Guide/Bugs
- **Collaborateur** — Tableau de bord (personnel), Week Planner, Objectifs (personnel), Projets assignés (+ mise à jour de ses tâches), Mes Comités (lecture), Guide/Bugs

Le composant sidebar reçoit la liste des items déjà filtrée par le serveur (Server Component) — ne jamais envoyer le menu complet au client puis masquer en CSS/JS.

**Responsive (tablette/mobile) :** sidebar repliée en drawer plein écran déclenché par une icône hamburger dans la barre supérieure. Jamais de sidebar permanente sous 1024px.

---

## Cards

Chaque section de contenu vit dans une card.

```
background: #FFFFFF
border: 1px solid var(--gray-200)
border-radius: 16px
padding: 24px
box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)
```

Jamais de fond de card coloré — toujours blanc, même sur fond `--facam-blue-tint`. La couleur entre dans la card via badges, barres et texte, jamais sur la surface elle-même.

---

## Typography Hierarchy

**Titres de section** — titres de card, titres de section de page

```
font-size: 16px
font-weight: 600
color: var(--facam-dark)
line-height: 24px
```

**Corps de texte / contenu principal**

```
font-size: 14px
font-weight: 500
color: var(--facam-black)
line-height: 20px
```

**Texte secondaire / atténué** — labels, timestamps, sous-titres

```
font-size: 12px
font-weight: 400
color: var(--gray-500)
line-height: 16px
```

Les chiffres clés (KPIs du tableau de bord, % d'avancement, taux ETP) utilisent 30px / poids 600 / `var(--facam-dark)`.

---

## Badges & Couleurs de Statut

Tous les badges utilisent `border-radius: 9999px` (pilule) sauf indication contraire.

```
padding: 2px 8px
font-size: 12px
font-weight: 500
```

**Statuts de tâche (Week Planner) :**

| Statut | Couleur fond | Couleur texte |
| --- | --- | --- |
| Débuté | `var(--facam-blue-tint)` | `var(--facam-blue)` |
| En cours | `rgba(var(--facam-yellow-rgb), 0.12)` | `#92600a` |
| Terminé | `#dcfce7` | `var(--color-success)` |
| Non terminé | `#fee2e2` | `var(--color-error)` |

**Statuts de projet :** Brouillon (gris neutre), Soumis (bleu charte), Validé (vert), Rejeté (rouge).

`var(--color-success)` (#16a34a) est un ajout applicatif — il n'existe pas dans la charte officielle (qui ne couvre que bleu/jaune/noir/blanc). Il est utilisé uniquement pour les statuts de réussite/validation, jamais comme couleur de marque.

---

## Buttons

**Bouton primaire :**

```
background: var(--facam-blue)
color: #FFFFFF
border-radius: 8px
padding: 8px 16px
font-size: 14px
font-weight: 600
hover: background var(--facam-dark)
```

**Bouton secondaire :**

```
background: #FFFFFF
border: 1px solid var(--gray-300)
color: var(--facam-dark)
border-radius: 8px
padding: 8px 16px
hover: background var(--gray-50)
```

**Bouton accent (action positive forte — ex. "Valider la semaine") :**

```
background: var(--facam-yellow)
color: var(--facam-dark)
border-radius: 8px
padding: 8px 16px
font-weight: 600
hover: filter brightness(1.05)
```

Réutilise exactement `.btn-primary` et `.btn-accent` déjà définis dans globals.css — ne pas redéfinir ces styles ailleurs, les référencer ou les recréer en classes Tailwind équivalentes.

---

## Form Inputs

```
background: #FFFFFF
border: 1px solid var(--gray-300)
border-radius: 8px
padding: 8px 12px
font-size: 14px
color: var(--facam-black)
placeholder color: var(--gray-400)
focus: ring-2 ring-[var(--facam-blue)]/20 border-[var(--facam-blue)]
```

Messages d'erreur de formulaire toujours en `var(--color-error)` (#b91c1c, déjà défini dans la charte) — jamais une autre teinte de rouge.

---

## Tables (Projets, Suivi ETP, Listes utilisateurs)

- Pas de lignes alternées — fond blanc uniquement, séparées par une bordure
- Bordure de ligne : `1px solid var(--gray-200)`
- En-têtes de colonne : majuscules, 12px, poids 500, `var(--gray-500)`
- Texte de ligne : 14px, `var(--facam-black)`
- État hover : `background: var(--gray-50)`

---

## Barres de Progression (Avancement projet, Charge ETP)

```
height: 6px
border-radius: 9999px
background track: var(--gray-200)
```

Couleur du remplissage selon le contexte :

- Avancement projet à temps / charge ETP normale : `var(--facam-blue)`
- Avancement en risque / charge ETP élevée (>90%) : `var(--facam-yellow)`
- Retard avéré / surcharge confirmée : `var(--color-error)`

---

## Empty States

Chaque section pouvant être vide doit avoir un état vide. Le garder minimal :

- Texte descriptif court en `var(--gray-400)`
- Icône optionnelle au-dessus du texte
- Bouton CTA si une action suivante logique existe (ex. "Aucun projet — Créer un projet")

---

## Bandeau de Consentement Notifications

Affiché une seule fois (tant que `notificationConsent = NOT_ASKED`), jamais en modale bloquante — un bandeau discret en haut de la zone de contenu, dismissible.

```
container: bg-facamWhite border border-gray200 rounded-xl p-4, flex items-center justify-between
icon: w-5 h-5 text-facamBlue
text: text-sm text-facamBlack
bouton "Activer": bouton accent (voir Buttons)
bouton "Plus tard": bouton ghost, text-gray500
```

Ne jamais déclencher `Notification.requestPermission()` avant que l'utilisateur ait cliqué sur "Activer" dans ce bandeau — la popup native du navigateur ne doit jamais apparaître sans ce contexte explicite.

---

## Tailwind v4 — Tokens à Ajouter dans globals.css

Le projet utilise déjà Tailwind v4 avec `@theme` dans globals.css pour `facamBlue`, `facamDark`, `facamYellow`, `facamWhite`, `facamBlack`. Avant de construire le premier composant de FACAM PERFORMER, étendre le même bloc `@theme` avec les tokens manquants nécessaires à l'application — sans toucher aux cinq tokens existants :

```css
@theme {
  /* — existants, ne pas modifier — */
  --color-facamBlue: #001b61;
  --color-facamDark: #000d32;
  --color-facamYellow: #ffae03;
  --color-facamWhite: #ffffff;
  --color-facamBlack: #000000;

  /* — ajouts FACAM PERFORMER — */
  --color-facamBlueMid: #002a6e;
  --color-facamBlueTint: #f0f4fa;
  --color-success: #16a34a;
  --color-successLight: #dcfce7;
  --color-error: #b91c1c;
  --color-errorLight: #fee2e2;
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
}
```

Cela permet d'utiliser `bg-facamBlueMid`, `text-gray500`, `bg-successLight`, etc. comme classes Tailwind normales — jamais via `bg-[var(--...)]` une fois le token déclaré dans `@theme`. Suivre la même convention de nommage camelCase déjà en place (`facamBlue`, pas `facam-blue`) pour rester cohérent avec l'existant.

---

## Do Nots

- Ne jamais modifier les valeurs des cinq couleurs de charte officielle ou les déclarations de police
- Ne jamais utiliser Blacksword dans FACAM PERFORMER — réservé aux pages publiques
- Ne jamais utiliser les classes couleur intégrées de Tailwind (`bg-purple-500`, `text-gray-600`) — utiliser uniquement les tokens du projet
- Ne jamais définir de couleur dans un fichier `tailwind.config.ts` — toujours via `@theme` dans globals.css
- Ne jamais ajouter de gradient sur le fond d'une card
- Ne jamais utiliser plus d'un poids de police dans un même élément d'UI
- Ne jamais afficher un message d'erreur brut à l'utilisateur — toujours un texte lisible
- Ne jamais empiler plus de 2 niveaux de border-radius imbriqués
- Ne jamais utiliser `position: fixed` sauf pour la sidebar elle-même et son drawer mobile
- Ne jamais envoyer la liste complète des items de menu au client puis la filtrer en JS — le filtrage par rôle se fait côté serveur
