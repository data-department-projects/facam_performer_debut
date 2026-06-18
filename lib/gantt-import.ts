import * as XLSX from "xlsx";
import { z } from "zod";

const ganttRowSchema = z.object({
  Titre: z.string().min(1, "Titre requis"),
  "Date début": z.string().min(1, "Date début requise"),
  "Date fin": z.string().min(1, "Date fin requise"),
  "Email responsable": z.string().email("Email invalide"),
  "Prérequis (titres)": z.string().optional(),
});

export type GanttRowParsed = z.infer<typeof ganttRowSchema>;

export type GanttImportResult =
  | { valid: true; rows: GanttRowParsed[] }
  | { valid: false; errors: string[] };

export function parseGanttExcel(buffer: Buffer): GanttImportResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    return { valid: false, errors: ["Fichier Excel invalide ou corrompu."] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { valid: false, errors: ["Le fichier Excel ne contient aucune feuille."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return { valid: false, errors: ["Le fichier Excel est vide."] };
  }

  const errors: string[] = [];
  const parsed: GanttRowParsed[] = [];

  rows.forEach((row: Record<string, unknown>, i: number) => {
    const result = ganttRowSchema.safeParse(row);
    if (!result.success) {
      const messages = result.error.issues.map((e: { message: string }) => e.message).join(", ");
      errors.push(`Ligne ${i + 2} : ${messages}`);
    } else {
      parsed.push(result.data);
    }
  });

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, rows: parsed };
}
