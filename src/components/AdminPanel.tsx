import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  display_name: string | null;
  email: string;
  plan: string;
  ai_usage: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  gratis: { label: "Gratis", color: "bg-muted text-muted-foreground" },
  estudiante: { label: "Estudiante", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  profesional: { label: "Profesional", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
};

const AdminPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [profilesRes, plansRes, usageRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name"),
        supabase.from("user_plans").select("user_id, plan"),
        supabase.from("ai_usage_log").select("user_id"),
      ]);

      const profiles = profilesRes.data || [];
      const plans = plansRes.data || [];
      const usageLogs = usageRes.data || [];

      // Count AI usage per user this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const usageCount: Record<string, number> = {};
      usageLogs.forEach((log) => {
        usageCount[log.user_id] = (usageCount[log.user_id] || 0) + 1;
      });

      const planMap: Record<string, string> = {};
      plans.forEach((p) => { planMap[p.user_id] = p.plan; });

      const merged: UserRow[] = profiles.map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: p.display_name || p.id.slice(0, 8),
        plan: planMap[p.id] || "gratis",
        ai_usage: usageCount[p.id] || 0,
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
      toast({ title: "Plan actualizado", description: `El plan se cambió a ${PLAN_LABELS[newPlan]?.label || newPlan}` });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Panel de Administrador
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gestiona los planes y permisos de los usuarios del sistema.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{users.length} usuarios registrados</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Plan actual</TableHead>
                    <TableHead className="text-center">Uso IA (mes)</TableHead>
                    <TableHead>Cambiar plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{u.display_name || "Sin nombre"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PLAN_LABELS[u.plan]?.color || ""} variant="secondary">
                          {u.plan === "profesional" && <Crown className="w-3 h-3 mr-1" />}
                          {PLAN_LABELS[u.plan]?.label || u.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{u.ai_usage}</TableCell>
                      <TableCell>
                        <Select value={u.plan} onValueChange={(v) => handlePlanChange(u.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-sm">
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
