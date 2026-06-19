"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Send, UserX } from "lucide-react";
import { createUser, updateUser, deactivateUser, sendUserCredentials } from "@/actions/admin";
import { generateRandomPassword } from "@/lib/generate-password";

type Team = { id: string; name: string; subDepartmentId: string };
type SubDept = { id: string; name: string; teams: Team[] };
type Department = { id: string; name: string; subDepartments: SubDept[] };

type UserData = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  departmentId: string;
  teamId: string | null;
};

type Props =
  | { mode: "create"; departments: Department[]; user?: never }
  | { mode: "edit"; departments: Department[]; user: UserData };

const inputClass =
  "rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20 w-full";

const selectClass =
  "rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20 w-full";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-facamBlack">
      {children}
    </label>
  );
}

export function UserForm({ mode, departments, user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSending, startSending] = useTransition();
  const [isDeactivating, startDeactivating] = useTransition();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "COLLABORATOR");
  const [departmentId, setDepartmentId] = useState(user?.departmentId ?? "");
  const [teamId, setTeamId] = useState(user?.teamId ?? "");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [credentialsSent, setCredentialsSent] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [sendOnCreate, setSendOnCreate] = useState(true);

  // Équipes disponibles — état dérivé, pas d'état géré
  const availableTeams = useMemo(() => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.subDepartments.flatMap((sd) => sd.teams) ?? [];
  }, [departments, departmentId]);

  // Réinitialiser l'équipe si elle n'appartient plus au département sélectionné
  useEffect(() => {
    if (teamId && !availableTeams.find((t) => t.id === teamId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeamId("");
    }
  }, [teamId, availableTeams]);

  function handleGeneratePassword() {
    setPassword(generateRandomPassword());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      fullName,
      email,
      role,
      departmentId,
      teamId: teamId || undefined,
      ...(mode === "create" ? { password } : { password: password || undefined }),
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createUser(data);
        if (result.success && result.userId) {
          if (sendOnCreate && password) {
            await sendUserCredentials(result.userId, password);
          }
          router.push(`/admin/users/${result.userId}`);
        } else {
          setError(result.error ?? "Une erreur est survenue.");
        }
      } else {
        const result = await updateUser(user.id, data);
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error ?? "Une erreur est survenue.");
        }
      }
    });
  }

  function handleSendCredentials() {
    if (!password) {
      setError("Renseignez un mot de passe avant d'envoyer les identifiants.");
      return;
    }
    if (mode !== "edit") return;
    setError(null);
    setCredentialsSent(false);

    startSending(async () => {
      const result = await sendUserCredentials(user.id, password);
      if (result.success) {
        setCredentialsSent(true);
        setPassword("");
      } else {
        setError(result.error ?? "Impossible d'envoyer les identifiants.");
      }
    });
  }

  function handleDeactivate() {
    if (mode !== "edit") return;
    startDeactivating(async () => {
      const result = await deactivateUser(user.id);
      if (result.success) {
        router.push("/admin/users");
      } else {
        setError(result.error ?? "Impossible de désactiver le compte.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-facamDark">Informations personnelles</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Valentine Agbekodo"
              className={inputClass}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="email">Adresse email</FieldLabel>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="valentine.agbekodo@facamstairway.com"
              className={inputClass}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="role">Rôle</FieldLabel>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectClass}
              required
            >
              <option value="COLLABORATOR">Collaborateur</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="departmentId">Département</FieldLabel>
            <select
              id="departmentId"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Sélectionner un département…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {availableTeams.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel htmlFor="teamId">Équipe (optionnel)</FieldLabel>
              <select
                id="teamId"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className={selectClass}
              >
                <option value="">Aucune équipe</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section mot de passe */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-facamDark">Mot de passe</h3>
        {mode === "edit" && (
          <p className="mb-4 text-xs text-gray500">
            Laisser vide pour ne pas modifier le mot de passe actuel.
          </p>
        )}

        <div className="flex gap-2">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            {...(mode === "create" ? { required: true } : {})}
          />
          <button
            type="button"
            onClick={handleGeneratePassword}
            title="Générer un mot de passe aléatoire"
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-gray600 hover:bg-gray50"
          >
            <RefreshCw size={14} /> Générer
          </button>
        </div>

        {/* Case à cocher — envoi des identifiants à la création */}
        {mode === "create" && (
          <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendOnCreate}
              onChange={(e) => setSendOnCreate(e.target.checked)}
              className="h-4 w-4 rounded border-gray300 accent-facamBlue"
            />
            <span className="text-sm text-facamBlack">
              Envoyer les identifiants par email après création
            </span>
          </label>
        )}

        {/* Bouton envoyer les identifiants — édition uniquement */}
        {mode === "edit" && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSendCredentials}
              disabled={isSending || !password}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-gray600 hover:bg-gray50 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Envoyer les identifiants par email
            </button>
            {credentialsSent && (
              <span className="text-xs text-success">Identifiants envoyés ✓</span>
            )}
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <p className="rounded-md bg-errorLight px-4 py-3 text-sm text-error">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {mode === "edit" && user.isActive ? (
          <div>
            {deactivateConfirm ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray500">Désactiver ce compte ?</span>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                  className="font-medium text-error hover:underline disabled:opacity-50"
                >
                  {isDeactivating ? "…" : "Confirmer"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeactivateConfirm(false)}
                  className="text-gray500 hover:underline"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeactivateConfirm(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray500 hover:text-error"
              >
                <UserX size={14} /> Désactiver le compte
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === "create" ? "Créer l'utilisateur" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}
