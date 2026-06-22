"use client";

import { useState } from "react";
import type { MockProject } from "./types";

type Props = {
  confirmedProjects: MockProject[];
  onAdd: (title: string, projectId: string | null) => void;
  onCancel: () => void;
};

export function AddTaskInline({ confirmedProjects, onAdd, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), projectId || null);
    setTitle("");
    setProjectId("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-facamBlue/30 bg-facamBlueTint/50 p-2.5"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de la tâche…"
        className="rounded border border-gray300 bg-facamWhite px-2 py-1.5 text-xs text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-1 focus:ring-facamBlue/20"
        required
        autoFocus
      />
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded border border-gray300 bg-facamWhite px-2 py-1.5 text-xs text-facamBlack focus:border-facamBlue focus:outline-none"
      >
        <option value="">Hors-projet</option>
        {confirmedProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex-1 rounded bg-facamBlue px-2 py-1 text-[10px] font-semibold text-facamWhite hover:bg-facamDark"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded border border-gray200 px-2 py-1 text-[10px] text-gray500 hover:bg-gray50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
