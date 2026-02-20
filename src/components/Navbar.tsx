import { Calculator, PieChart, Utensils, BarChart3, LogIn } from "lucide-react";

const navItems = [
  { label: "Dietocálculo", icon: Calculator, active: true },
  { label: "Distribución", icon: PieChart, active: false },
  { label: "Dieta", icon: Utensils, active: false },
  { label: "Calculadoras", icon: BarChart3, active: false },
  { label: "Gráficos", icon: PieChart, active: false },
];

const Navbar = () => {
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
              key={item.label}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Login */}
        <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Iniciar Sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
