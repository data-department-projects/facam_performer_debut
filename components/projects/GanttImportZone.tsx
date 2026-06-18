"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, X, AlertCircle } from "lucide-react";
import { importGanttTasks } from "@/actions/ganttTasks";

type Props = {
  projectId: string;
};

export function GanttImportZone({ projectId }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const isXlsx =
      f.name.endsWith(".xlsx") ||
      f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isXlsx) {
      setError("Format non supporté. Importer uniquement un fichier .xlsx");
      return;
    }
    setFile(f);
    setError(null);
    setSuccess(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleImport = () => {
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    startTransition(async () => {
      const result = await importGanttTasks(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur inattendue.");
      } else {
        setSuccess(true);
        setFile(null);
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-facamDark">Import du planning Excel</h3>
        <a
          href="#"
          className="text-xs font-medium text-facamBlue hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Télécharger le template
        </a>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-successLight bg-successLight/30 px-4 py-3">
          <CheckCircle2 size={16} className="text-success flex-shrink-0" />
          <p className="text-sm font-medium text-success">
            Planning importé avec succès.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-errorLight bg-errorLight/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-error flex-shrink-0 mt-0.5" />
            <p className="text-xs text-error whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-successLight bg-successLight/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-success" />
            <div>
              <p className="text-sm font-medium text-facamDark">{file.name}</p>
              <p className="text-xs text-gray400">
                {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 size={14} />
              Fichier accepté
            </span>
            <button
              type="button"
              onClick={() => { setFile(null); setError(null); }}
              className="text-gray400 hover:text-error transition-colors"
              aria-label="Supprimer le fichier"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-10 transition-colors ${
            dragOver
              ? "border-facamBlue bg-facamBlueTint"
              : "border-gray200 bg-gray50 hover:border-facamBlue hover:bg-facamBlueTint"
          }`}
        >
          <Upload
            size={28}
            className={dragOver ? "text-facamBlue" : "text-gray400"}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-facamBlack">
              Glisser-déposer votre fichier Excel ici
            </p>
            <p className="mt-0.5 text-xs text-gray400">
              ou cliquer pour parcourir — Format .xlsx uniquement
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {file && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
            onClick={handleImport}
          >
            <Upload size={15} />
            {isPending ? "Import en cours..." : "Importer le planning"}
          </button>
        </div>
      )}
    </div>
  );
}
