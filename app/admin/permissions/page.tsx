import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-facamDark">
          Configuration des permissions
        </h2>
        <p className="mt-1 text-sm text-gray500">
          Définissez l&apos;accès des Managers et Collaborateurs sur chaque module.
        </p>
      </div>

      <PermissionsMatrix />
    </div>
  );
}
