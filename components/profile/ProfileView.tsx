"use client";

import { useState } from "react";
import { User, Mail, Building2, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/actions/profile";

type Props = {
  fullName: string;
  email: string;
  role: string;
  departmentName: string;
  memberSince: string;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

export function ProfileView({ fullName, email, role, departmentName, memberSince }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await changePassword({ currentPassword, newPassword, confirmPassword });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const initials = fullName.slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Info card */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6">
        <h2 className="mb-5 text-base font-semibold text-facamDark">Informations du compte</h2>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-facamBlueMid text-xl font-semibold text-facamWhite">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-facamDark">{fullName}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-infoLight px-2.5 py-0.5 text-xs font-medium text-facamBlue">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField icon={<Mail size={15} />} label="Adresse email" value={email} />
          <InfoField icon={<Shield size={15} />} label="Rôle" value={roleLabel} />
          <InfoField icon={<Building2 size={15} />} label="Département" value={departmentName} />
          <InfoField icon={<User size={15} />} label="Membre depuis" value={memberSince} />
        </div>
      </div>

      {/* Password change card */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock size={16} className="text-facamBlue" />
          <h2 className="text-base font-semibold text-facamDark">Changer le mot de passe</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Mot de passe actuel"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            id="newPassword"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            hint="8 caractères minimum"
          />
          <PasswordField
            id="confirmPassword"
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />

          {error && (
            <p className="rounded-lg bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-successLight px-3 py-2 text-sm text-success">
              Mot de passe modifié avec succès.
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-facamBlue px-5 py-2 text-sm font-medium text-facamWhite transition hover:bg-facamBlueMid disabled:opacity-60"
            >
              {isSubmitting ? "Modification…" : "Modifier le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-facamDark">{value}</span>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-lg border border-gray200 bg-facamWhite px-3 py-2 pr-10 text-sm text-facamDark placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-1 focus:ring-facamBlue"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray400 hover:text-gray600"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray500">{hint}</p>}
    </div>
  );
}
