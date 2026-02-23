import { Calculator, PieChart, Utensils, BarChart3, ChefHat } from "lucide-react";

export type NavTab = "dietocalculo" | "distribucion" | "dieta" | "calculadoras" | "graficos" | "platillos";

const navItems: { label: string; icon: typeof Calculator; tab: NavTab }[] = [
  { label: "Dietocálculo", icon: Calculator, tab: "dietocalculo" },
  { label: "Distribución", icon: PieChart, tab: "distribucion" },
  { label: "Dieta", icon: Utensils, tab: "dieta" },
  { label: "Platillos", icon: ChefHat, tab: "platillos" },
  { label: "Calculadoras", icon: BarChart3, tab: "calculadoras" },
  { label: "Gráficos", icon: PieChart, tab: "graficos" },
];

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const Navbar = ({ activeTab, onTabChange }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            SN
          </div>
          <span className="font-bold text-lg text-primary hidden sm:inline">Super Nutrein</span>
        </div>

        {/* Nav items */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-0.5 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === item.tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
