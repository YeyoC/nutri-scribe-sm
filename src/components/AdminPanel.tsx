import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Crown, Mail, Calendar, Clock, UtensilsCrossed, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { sanitizeText } from "@/lib/security";

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string;
  is_banned: boolean;
  ai_usage: number;
  platillos_count: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  gratis: { label: "Gratis", color: "bg-muted text-muted-foreground" },
  estudiante: { label: "Estudiante", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  profesional: { label: "Profesional", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  return formatDate(dateStr);
}

const AdminPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get admin user data via secure function
      const { data: adminData, error } = await supabase.rpc("get_admin_users_data");
      if (error) throw error;

      // Get platillos count and AI usage per user
      const [platillosRes, usageRes] = await Promise.all([
        supabase.from("platillos").select("user_id"),
        supabase.from("ai_usage_log").select("user_id"),
      ]);

      const platillosCount: Record<string, number> = {};
      (platillosRes.data || []).forEach((p: any) => {
        platillosCount[p.user_id] = (platillosCount[p.user_id] || 0) + 1;
      });

      const usageCount: Record<string, number> = {};
      (usageRes.data || []).forEach((u: any) => {
        usageCount[u.user_id] = (usageCount[u.user_id] || 0) + 1;
      });

      const merged: UserRow[] = (adminData || []).map((u: any) => ({
        ...u,
        ai_usage: usageCount[u.user_id] || 0,
        platillos_count: platillosCount[u.user_id] || 0,
      }));

      setUsers(merged);
    } catch {
      toast({ title: "Error al cargar usuarios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    const { error } = await supabase
      .from("user_plans")
      .update({ plan: newPlan })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error al cambiar plan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan actualizado", description: `Plan cambiado a ${PLAN_LABELS[newPlan]?.label || newPlan}` });
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, plan: newPlan } : u));
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: users.length,
    gratis: users.filter((u) => u.plan === "gratis").length,
    estudiante: users.filter((u) => u.plan === "estudiante").length,
    profesional: users.filter((u) => u.plan === "profesional").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.gratis}</p>
            <p className="text-xs text-muted-foreground">Plan Gratis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.estudiante}</p>
            <p className="text-xs text-muted-foreground">Plan Estudiante</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{stats.profesional}</p>
            <p className="text-xs text-muted-foreground">Plan Profesional</p>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Panel de Administrador
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuario</TableHead>
                    <TableHead><Mail className="w-3.5 h-3.5 inline mr-1" />Correo</TableHead>
                    <TableHead>Plan actual</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead className="text-center"><UtensilsCrossed className="w-3.5 h-3.5 inline mr-1" />Platillos</TableHead>
                    <TableHead className="text-center">Uso IA</TableHead>
                    <TableHead><Calendar className="w-3.5 h-3.5 inline mr-1" />Registro</TableHead>
                    <TableHead><Clock className="w-3.5 h-3.5 inline mr-1" />Último acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cambiar plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {u.display_name || "Sin nombre"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={PLAN_LABELS[u.plan]?.color || ""} variant="secondary">
                          {u.plan === "profesional" && <Crown className="w-3 h-3 mr-1" />}
                          {PLAN_LABELS[u.plan]?.label || u.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">
                        Próximamente
                      </TableCell>
                      <TableCell className="text-center text-sm">{u.platillos_count}</TableCell>
                      <TableCell className="text-center text-sm">{u.ai_usage}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {timeAgo(u.last_sign_in_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_banned ? "destructive" : "outline"} className="text-xs">
                          {u.is_banned ? "Suspendido" : "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={u.plan} onValueChange={(v) => handlePlanChange(u.user_id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gratis">Gratis</SelectItem>
                            <SelectItem value="estudiante">Estudiante</SelectItem>
                            <SelectItem value="profesional">Profesional</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
