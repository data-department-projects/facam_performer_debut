"use client";

import { useRef, useState } from "react";
import { CalendarDays, Upload, ExternalLink, Loader2 } from "lucide-react";
import type { KeyResultWithCert, ObjectiveType, Certificate } from "./types";
import { KRStatusBadge } from "./ObjectiveStatusBadge";
import { uploadCertificate } from "@/actions/objectives";

type Props = {
  keyResult: KeyResultWithCert;
  objectiveType: ObjectiveType;
  onUpdate?: () => void;
  onCertificateUploaded?: (cert: Certificate) => void;
  readonly?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function KeyResultCard({
  keyResult,
  objectiveType,
  onUpdate,
  onCertificateUploaded,
  readonly = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showProgress =
    objectiveType === "PERFORMANCE" && keyResult.targetValue !== null;
  const progressPct = showProgress
    ? Math.min(
        100,
        Math.round(
          ((keyResult.currentValue ?? 0) / (keyResult.targetValue ?? 1)) * 100,
        ),
      )
    : 0;
  const showCertZone =
    !readonly &&
    objectiveType === "SKILLS_DEVELOPMENT" &&
    keyResult.status !== "DONE";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("keyResultId", keyResult.id);

    const result = await uploadCertificate(formData);
    setIsUploading(false);

    if (!result.success || !result.attachment) {
      setUploadError(result.error ?? "Erreur lors de l'upload");
      return;
    }

    onCertificateUploaded?.({
      id: result.attachment.id,
      fileName: result.attachment.fileName,
      signedUrl: result.attachment.signedUrl,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-gray200 bg-gray50 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm font-medium leading-snug text-facamDark">
          {keyResult.description}
        </p>
        <div className="flex flex-shrink-0 items-center gap-2">
          <KRStatusBadge status={keyResult.status} />
          {!readonly && onUpdate && (
            <button
              onClick={onUpdate}
              className="rounded-md border border-gray200 bg-facamWhite px-2.5 py-1 text-xs font-medium text-facamDark hover:bg-gray100"
            >
              Mettre à jour
            </button>
          )}
        </div>
      </div>

      {/* Progression PERFORMANCE */}
      {showProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray500">Progression</span>
            <span className="font-medium text-facamDark">
              {keyResult.currentValue ?? 0} / {keyResult.targetValue}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
            <div
              className="h-full rounded-full bg-facamBlue transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Note de preuve */}
      {keyResult.evidenceNote && (
        <p className="mt-2 text-xs italic text-gray500">
          &quot;{keyResult.evidenceNote}&quot;
        </p>
      )}

      {/* Date limite */}
      {keyResult.dueDate && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray400">
          <CalendarDays size={11} />
          <span>Échéance : {formatDate(keyResult.dueDate)}</span>
        </div>
      )}

      {/* Certificat existant */}
      {keyResult.certificate && (
        <a
          href={keyResult.certificate.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-facamBlue hover:text-facamDark"
        >
          <ExternalLink size={11} />
          {keyResult.certificate.fileName}
        </a>
      )}

      {/* Zone upload certificat — SKILLS_DEVELOPMENT actif */}
      {showCertZone && (
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray300 bg-facamWhite px-4 py-3 text-xs text-gray500 transition-colors hover:border-facamBlue hover:text-facamBlue disabled:cursor-wait disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            {isUploading
              ? "Upload en cours…"
              : keyResult.certificate
                ? "Remplacer le certificat"
                : "Uploader un certificat"}
          </button>
          {uploadError && (
            <p className="mt-1.5 text-xs text-error">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
}
