

## Plan : Bouton toggle +/- dans la sidebar

### Objectif
Supprimer le `SidebarTrigger` du contenu principal et le remplacer par un bouton toggle +/- intégré en haut de la sidebar, qui gère le mode plié/déplié.

### Modifications

**1. `src/components/AppSidebar.tsx`**
- Importer `toggleSidebar` depuis `useSidebar()`
- Importer `Plus`, `Minus` depuis lucide-react
- Ajouter un `SidebarHeader` avec un bouton qui affiche `Minus` quand déplié et `Plus` quand plié
- Au clic, appeler `toggleSidebar()`

**2. `src/pages/Index.tsx`**
- Supprimer l'import de `SidebarTrigger`
- Supprimer le `<div className="px-6 pt-2"><SidebarTrigger /></div>` (lignes 133-135)

### Fichiers modifiés : 2
- `src/components/AppSidebar.tsx`
- `src/pages/Index.tsx`

