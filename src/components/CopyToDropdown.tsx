import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export interface CopyTarget {
  id: string;
  name: string;
  color?: string;
}

interface CopyToDropdownProps {
  targets: CopyTarget[];
  /** Whether the item is currently in personal situation (hide that option) */
  isPersonal?: boolean;
  /** Current scenario id if item belongs to a scenario (hide that option) */
  currentScenarioId?: string;
  onCopyToPersonal: () => void;
  onCopyToScenario: (scenarioId: string) => void;
  itemLabel?: string;
}

export function CopyToDropdown({
  targets,
  isPersonal = false,
  currentScenarioId,
  onCopyToPersonal,
  onCopyToScenario,
  itemLabel = 'l\'élément',
}: CopyToDropdownProps) {
  const availableTargets = targets.filter(t => t.id !== currentScenarioId);

  if (availableTargets.length === 0 && isPersonal) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Copier vers...">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">Copier vers…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isPersonal && (
          <DropdownMenuItem
            onClick={() => {
              onCopyToPersonal();
              toast.success(`${itemLabel} copié vers Situation personnelle`);
            }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 shrink-0" />
            Situation personnelle
          </DropdownMenuItem>
        )}
        {availableTargets.map(target => (
          <DropdownMenuItem
            key={target.id}
            onClick={() => {
              onCopyToScenario(target.id);
              toast.success(`${itemLabel} copié vers ${target.name}`);
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-2 shrink-0"
              style={{ backgroundColor: target.color || 'hsl(var(--primary))' }}
            />
            {target.name}
          </DropdownMenuItem>
        ))}
        {availableTargets.length === 0 && isPersonal && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Aucun scénario disponible
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
