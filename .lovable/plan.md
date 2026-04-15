

## Plan : Regrouper Charges, Revenus et Patrimoine dans un conteneur

### Objectif
Entourer les 3 sections collapsibles (Charges, Revenus, Patrimoine) dans un bloc `rounded-xl border bg-card p-3 sm:p-4` avec des séparateurs entre chaque section, pour un rendu cohérent avec le bloc "Répartition mensuelle" au-dessus.

### Modification

**`src/components/ScenarioManager.tsx`** (lignes 566-651)
- Envelopper les 3 `<Collapsible>` (Charges, Revenus, Patrimoine) dans un `<div className="rounded-xl border bg-card p-3 sm:p-4 space-y-4">`.
- Ajouter des `<div className="h-px bg-border/40" />` entre chaque section collapsible pour séparer visuellement.
- Le `<CategoryBreakdown>` reste en dehors, après ce conteneur.

### Résultat
Les 3 listes sont visuellement regroupées dans une carte, alignées avec le style du bloc répartition mensuelle.

### Fichier modifié : 1
- `src/components/ScenarioManager.tsx`

