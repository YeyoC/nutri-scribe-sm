import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

type AuthMode = "login" | "register" | "forgot" | "verify-mfa";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");

  // Redirect if already logged in
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if MFA is required
      if (data.session === null && data.user === null) {
        // MFA challenge needed - this shouldn't happen with signInWithPassword
        // MFA is handled via the session's aal level
      }

      // Check for MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp && factors.totp.length > 0) {
        const factor = factors.totp[0];
        if (factor.status === "verified") {
          // Need to verify with TOTP
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
          if (challengeError) throw challengeError;
          setMfaFactorId(factor.id);
          setMode("verify-mfa");
          setLoading(false);
          return;
        }
      }

      toast.success("¡Bienvenido de vuelta!");
      navigate("/", { replace: true });
    } catch (e: any) {
      if (e.message?.includes("Email not confirmed")) {
        toast.error("Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
      } else if (e.message?.includes("Invalid login")) {
        toast.error("Correo o contraseña incorrectos");
      } else {
        toast.error(e.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { data: challengeData } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (!challengeData) throw new Error("Error al generar desafío MFA");

      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });
      if (error) throw error;
      toast.success("¡Verificación exitosa!");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Código incorrecto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      toast.error("Completa todos los campos");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName },
        },
      });
      if (error) throw error;
      toast.success("¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta. 📧");
      setMode("login");
    } catch (e: any) {
      if (e.message?.includes("already registered")) {
        toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        toast.error(e.message || "Error al registrarse");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Ingresa tu correo electrónico");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo. 📧");
      setMode("login");
    } catch (e: any) {
      toast.error(e.message || "Error al enviar el enlace");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "verify-mfa") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="glass-card p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-3">
                SN
              </div>
              <h1 className="text-xl font-bold text-foreground">Verificación en 2 pasos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresa el código de tu aplicación autenticadora
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Código de 6 dígitos</label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-center text-lg tracking-[0.3em] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerifyMfa}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verificar
            </button>

            <button
              onClick={() => { setMode("login"); setMfaCode(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-6 space-y-5">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-3">
              SN
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {mode === "login" && "Iniciar sesión"}
              {mode === "register" && "Crear cuenta"}
              {mode === "forgot" && "Recuperar contraseña"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" && "Accede a Super Nutrein"}
              {mode === "register" && "Regístrate para guardar tus datos"}
              {mode === "forgot" && "Te enviaremos un enlace a tu correo"}
            </p>
          </div>

          {/* Register: Display name */}
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "register" && (
                <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
              )}
            </div>
          )}

          {/* Confirm password */}
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Forgot password link */}
          {mode === "login" && (
            <button
              onClick={() => setMode("forgot")}
              className="text-xs text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {/* Submit button */}
          <button
            onClick={
              mode === "login" ? handleLogin :
              mode === "register" ? handleRegister :
              handleForgotPassword
            }
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" && "Iniciar sesión"}
            {mode === "register" && "Crear cuenta"}
            {mode === "forgot" && "Enviar enlace"}
          </button>

          {/* Toggle mode */}
          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
                  Regístrate
                </button>
              </>
            )}
            {mode === "register" && (
              <>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                  Inicia sesión
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
