import { ListChecks, GitCompare } from 'lucide-react';

const items = [
  { title: 'Situation', value: 'actual', icon: ListChecks },
  { title: 'Scénarios', value: 'projections', icon: GitCompare },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors ${
              activeTab === item.value
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
