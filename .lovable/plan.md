

## Plan : Déplacer la navigation de la sidebar vers le header

### Objectif
Supprimer la sidebar latérale et intégrer les 3 onglets de navigation (Situation, Catégories, Scénarios) directement dans le header, sous forme de tabs/boutons horizontaux.

### Modifications

**1. `src/pages/Index.tsx`**
- Supprimer l'import de `SidebarProvider` et `AppSidebar`
- Supprimer le wrapper `<SidebarProvider>` et le composant `<AppSidebar>`
- Ajouter les 3 boutons de navigation dans le header (entre le logo et les actions export/import), avec icônes ListChecks, PieChart, GitCompare
- Style : boutons inline avec état actif (primary/underline), alignés horizontalement
- Supprimer le sticky page title (ligne 172-176) devenu redondant puisque le tab actif est visible dans le header
- Ajuster le layout : plus besoin du flex row sidebar+content, le contenu prend toute la largeur

**2. `src/components/MobileNav.tsx`**
- Conserver tel quel pour la navigation mobile bottom bar (elle reste pertinente sur mobile)

**3. `src/components/AppSidebar.tsx`**
- Fichier supprimé (plus utilisé)

### Résultat
Navigation horizontale intégrée au header, plus de sidebar, layout simplifié pleine largeur.

### Fichiers modifiés : 2 (+1 supprimé)
- `src/pages/Index.tsx` — restructuration header + layout
- `src/components/AppSidebar.tsx` — suppression

