import { Skin } from '@/hooks/useSkin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface SkinSelectorProps {
  skin: Skin;
  setSkin: (skin: Skin) => void;
}

const skins: { value: Skin; label: string }[] = [
  { value: 'legacy', label: 'Legacy' },
  { value: 'focus', label: 'Focus' },
];

export function SkinSelector({ skin, setSkin }: SkinSelectorProps) {
  return (
    <Select value={skin} onValueChange={(v) => setSkin(v as Skin)}>
      <SelectTrigger className="h-9 w-[120px] rounded-xl text-xs gap-1.5 border-border/60">
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {skins.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
