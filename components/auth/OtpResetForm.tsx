"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";

import {
  requestOtpSchema,
  type RequestOtpInput,
} from "@/lib/schemas/auth";
import {
  requestPasswordReset,
  checkOtpValid,
  verifyOtpAndResetPassword,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "request" | "verify" | "password" | "success";

const OTP_LENGTH = 6;
const OTP_SECONDS = 10 * 60;

// ─── Étape 1 : saisie de l'email ─────────────────────────────────────────────
function RequestStep({
  onSuccess,
}: {
  onSuccess: (email: string) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RequestOtpInput>({ resolver: zodResolver(requestOtpSchema) });

  async function onSubmit(data: RequestOtpInput) {
    setServerError(null);
    const result = await requestPasswordReset(data.email);
    if (!result.success) {
      setServerError(result.error ?? "Une erreur est survenue. Veuillez réessayer.");
      return;
    }
    onSuccess(data.email);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <p className="text-sm text-gray500">
        Entrez votre adresse email. Vous recevrez un code à 6 chiffres valable 10 minutes.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-facamBlack">
          Adresse email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@facam-stairway.com"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-error">{form.formState.errors.email.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{serverError}</p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-facamBlue text-facamWhite hover:bg-facamDark"
        >
          {form.formState.isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" />Envoi…</>
          ) : (
            "Envoyer le code"
          )}
        </Button>
        <a href="/login" className="text-center text-sm text-gray500 hover:text-facamBlue hover:underline">
          Retour à la connexion
        </a>
      </div>
    </form>
  );
}

// ─── Étape 2 : saisie de l'OTP (6 cases individuelles + chrono) ──────────────
function VerifyStep({
  email,
  onSuccess,
  onResend,
}: {
  email: string;
  onSuccess: (code: string) => void;
  onResend: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Compte à rebours
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft <= 0;
  const code = digits.join("");

  function handleChange(index: number, value: string) {
    // Accepte uniquement les chiffres
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleVerify() {
    if (code.length < OTP_LENGTH) {
      setError("Veuillez saisir les 6 chiffres du code.");
      return;
    }
    if (expired) {
      setError("Le code a expiré. Demandez un nouveau code.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await checkOtpValid(email, code);
    setLoading(false);
    if (!result.valid) {
      setError("Code invalide ou expiré. Vérifiez votre email ou demandez un nouveau code.");
      return;
    }
    onSuccess(code);
  }

  async function handleResend() {
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    setSecondsLeft(OTP_SECONDS);
    await requestPasswordReset(email);
    onResend();
    inputRefs.current[0]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-sm text-gray500">
        Entrez le code envoyé à votre adresse e-mail.
      </p>

      {/* 6 cases OTP */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-facamBlack">Code de vérification</Label>
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={[
                "h-14 w-12 rounded-lg border-2 text-center text-xl font-semibold text-facamDark outline-none transition-colors",
                digit
                  ? "border-facamBlue bg-facamBlueTint"
                  : "border-gray200 bg-facamWhite",
                "focus:border-facamBlue focus:ring-2 focus:ring-facamBlue/20",
              ].join(" ")}
            />
          ))}
        </div>

        {/* Chrono */}
        <p className="text-center text-xs text-gray500">
          {expired ? (
            <span className="text-error">Code expiré</span>
          ) : (
            <>
              Code valide pendant{" "}
              <span className="font-semibold text-facamBlue">
                {minutes}:{seconds}
              </span>
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={handleVerify}
          disabled={loading || expired || code.length < OTP_LENGTH}
          className="w-full bg-facamBlue text-facamWhite hover:bg-facamDark"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" />Vérification…</>
          ) : (
            <><KeyRound size={16} />Vérifier le code</>
          )}
        </Button>

        <p className="text-center text-sm text-gray500">
          Pas reçu le code ?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-facamBlue hover:underline"
          >
            Renvoyer
          </button>
        </p>

        <a href="/login" className="text-center text-sm text-gray500 hover:text-facamBlue hover:underline">
          Retour à la connexion
        </a>
      </div>
    </div>
  );
}

// ─── Étape 3 : nouveau mot de passe ──────────────────────────────────────────
function PasswordStep({
  email,
  code,
  onSuccess,
}: {
  email: string;
  code: string;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const result = await verifyOtpAndResetPassword(email, code, newPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue. Veuillez réessayer.");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-gray500">
        Définissez votre nouveau mot de passe. Il doit contenir au moins 8 caractères.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword" className="text-sm font-medium text-facamBlack">
          Nouveau mot de passe
        </Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-facamBlack">
          Confirmer le mot de passe
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-facamBlue text-facamWhite hover:bg-facamDark"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" />Enregistrement…</>
        ) : (
          "Réinitialiser le mot de passe"
        )}
      </Button>
    </form>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function OtpResetForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Titre de la card selon l'étape
  const cardTitle =
    step === "request"
      ? "Mot de passe oublié"
      : step === "verify"
        ? "Vérification OTP"
        : step === "password"
          ? "Nouveau mot de passe"
          : "Mot de passe mis à jour";

  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-facamDark">{cardTitle}</h2>

      {step === "request" && (
        <RequestStep
          onSuccess={(e) => {
            setEmail(e);
            setStep("verify");
          }}
        />
      )}

      {step === "verify" && (
        <VerifyStep
          email={email}
          onSuccess={(c) => {
            setCode(c);
            setStep("password");
          }}
          onResend={() => {/* état déjà réinitialisé dans le composant */}}
        />
      )}

      {step === "password" && (
        <PasswordStep
          email={email}
          code={code}
          onSuccess={() => setStep("success")}
        />
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-successLight">
            <span className="text-2xl text-success">✓</span>
          </div>
          <div>
            <p className="font-semibold text-facamDark">Mot de passe mis à jour</p>
            <p className="mt-1 text-sm text-gray500">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
          </div>
          <a href="/login" className="text-sm font-medium text-facamBlue hover:underline">
            Retour à la connexion
          </a>
        </div>
      )}
    </>
  );
}
