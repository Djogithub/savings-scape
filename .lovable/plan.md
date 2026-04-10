

## Plan

### 1. Corriger le z-index des tooltips de la sidebar

Le tooltip des items de la sidebar (visible au hover en mode collapsed) utilise `z-50` mais se retrouve sous d'autres éléments (header sticky, etc.). On passe le `TooltipContent` à `z-[100]` dans `src/components/ui/tooltip.tsx`.

**Fichier** : `src/components/ui/tooltip.tsx` — changer `z-50` → `z-[100]`

### 2. Ajouter un graphique circulaire (pie chart) dans la vue détail d'un scénario

Après les `SummaryCards`, insérer un composant `ScenarioPieChart` qui affiche un donut/pie chart avec 3 segments :
- **Revenus mensuels** (vert/primary)
- **Charges mensuelles** (rouge/destructive)
- **Solde** (bleu/accent)

Le graphique utilise Recharts (`PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`), déjà disponible dans le projet via les dépendances de `TimelineChart`.

**Nouveau fichier** : `src/components/ScenarioPieChart.tsx`
- Props : `charges: Charge[], incomes: Income[]`
- Calcule les totaux mensuels via `getCurrentMonthChargesTotal` / `getCurrentMonthIncomesTotal`
- Affiche un donut chart responsive avec les 3 valeurs

**Fichier modifié** : `src/components/ScenarioManager.tsx`
- Import du nouveau composant
- Insertion après la ligne `<SummaryCards ...>` (ligne 402), dans le bloc du scénario actif

### Estimation : ~2 fichiers modifiés, 1 créé

