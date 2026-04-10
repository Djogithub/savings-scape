

## Plan : Fusionner SummaryCards et PieChart dans un cartouche unique

### Objectif
Regrouper le graphique circulaire et les 4 cards (Revenus, Charges, Solde, Charges fixes) dans un seul bloc "Répartition mensuelle" : pie chart à gauche (50%), cards en grille 2x2 à droite (50%).

### Modifications

**1. `src/components/ScenarioManager.tsx`** (lignes 403-405)
- Supprimer les appels séparés à `<SummaryCards>` et `<ScenarioPieChart>`
- Les remplacer par un unique bloc card "Répartition mensuelle" contenant :
  - Gauche : le `<ScenarioPieChart>` (sans son propre wrapper/titre)
  - Droite : le `<SummaryCards>` en mode compact grille 2x2

**2. `src/components/ScenarioPieChart.tsx`**
- Ajouter une prop optionnelle `bare?: boolean` pour rendre le chart sans le wrapper card ni le titre (juste le `ResponsiveContainer`)
- Quand `bare=true`, retourner uniquement le graphique

**3. `src/components/SummaryCards.tsx`**
- Ajouter un mode `grid2x2?: boolean` qui force `grid-cols-2` (2 colonnes, 2 lignes) au lieu de `grid-cols-4`

**4. Layout dans ScenarioManager** :
```
<div className="rounded-xl border bg-card p-4">
  <h3 className="text-sm font-semibold mb-3">Répartition mensuelle</h3>
  <div className="flex flex-col md:flex-row gap-4">
    <div className="w-full md:w-1/2">
      <ScenarioPieChart ... bare />
    </div>
    <div className="w-full md:w-1/2">
      <SummaryCards ... compact grid2x2 />
    </div>
  </div>
</div>
```

### Fichiers modifiés : 3
- `src/components/ScenarioManager.tsx`
- `src/components/ScenarioPieChart.tsx`
- `src/components/SummaryCards.tsx`
