import { Calculator, PieChart, Utensils, BarChart3, ChefHat, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

export type NavTab = "dietocalculo" | "distribucion" | "dieta" | "calculadoras" | "graficos" | "platillos" | "configuracion";

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
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Usuario";

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

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { onTabChange("configuracion"); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4" /> Configuración
              </button>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center gap-0.5 overflow-x-auto px-4 pb-2">
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
    </header>
  );
};

export default Navbar;
