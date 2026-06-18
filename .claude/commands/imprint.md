Lis et suis exactement le protocole défini dans `.agents/skills/imprint/SKILL.md`.

Cible : $ARGUMENTS

- Si l'argument est "audit" → exécute le Mode Audit.
- Si un chemin de fichier est fourni → analyse ce fichier spécifique.
- Si aucun argument → identifie automatiquement les composants récemment créés ou modifiés.

Après extraction, mets à jour `context/ui-registry.md` (ce projet utilise ce fichier comme registre UI).
