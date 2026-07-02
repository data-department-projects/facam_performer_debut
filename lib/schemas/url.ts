import { z } from "zod";

// z.string().url() accepte n'importe quel schéma valide (javascript:, data:...) — on restreint
// explicitement à http(s) pour tout lien saisi par un utilisateur et rendu en <a href>.
export const httpUrlSchema = z
  .string()
  .url("URL invalide")
  .refine((url) => /^https?:\/\//i.test(url), "Seuls les liens http(s) sont autorisés");
