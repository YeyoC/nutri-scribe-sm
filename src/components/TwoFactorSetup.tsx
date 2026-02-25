import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const TwoFactorSetup = () => {
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasVerifiedFactor, setHasVerifiedFactor] = useState<boolean | null>(null);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      setHasVerifiedFactor(!!verified);
      setExistingFactorId(verified?.id ?? null);
    } catch {
      setHasVerifiedFactor(false);
    }
  }, []);

  // Check on mount
  useState(() => { checkStatus(); });

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Google Authenticator",
      });
      if (error) throw error;
      if (data) {
        setQrUri(data.totp.uri);
        setFactorId(data.id);
        setEnrolling(true);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al configurar 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { data: challengeData, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (error) throw error;

      toast.success("Autenticación de 2 pasos activada ✅");
      setEnrolling(false);
      setQrUri("");
      setVerifyCode("");
      setHasVerifiedFactor(true);
      setExistingFactorId(factorId);
    } catch (e: any) {
      toast.error(e.message || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!existingFactorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: existingFactorId });
      if (error) throw error;
      toast.success("Autenticación de 2 pasos desactivada");
      setHasVerifiedFactor(false);
      setExistingFactorId(null);
    } catch (e: any) {
      toast.error(e.message || "Error al desactivar 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (hasVerifiedFactor === null) return null;

  if (hasVerifiedFactor) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Autenticación de 2 pasos</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Tu cuenta tiene la verificación en 2 pasos activada con Google Authenticator.
        </p>
        <button
          onClick={handleUnenroll}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Desactivar 2FA
        </button>
      </div>
    );
  }

  if (enrolling) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Configurar 2FA</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Escanea este código QR con Google Authenticator u otra app compatible:
        </p>

        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG value={qrUri} size={180} />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Ingresa el código de 6 dígitos de tu app
          </label>
          <input
            type="text"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-center text-lg tracking-[0.3em] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setEnrolling(false); setQrUri(""); setVerifyCode(""); }}
            className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-input hover:bg-muted transition-colors text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verificar y activar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldOff className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-bold text-foreground">Autenticación de 2 pasos</h3>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Opcional</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Agrega una capa extra de seguridad a tu cuenta usando Google Authenticator.
      </p>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        Activar 2FA
      </button>
    </div>
  );
};

export default TwoFactorSetup;
