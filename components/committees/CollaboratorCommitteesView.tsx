"use client";

import { MyCommitteeCard, type MyCommittee } from "@/components/committees/MyCommitteeCard";
import { MyCommitteeActionsList, type MyCommitteeAction } from "@/components/committees/MyCommitteeActionsList";

type Props = {
  committees: MyCommittee[];
  myActions: MyCommitteeAction[];
};

export function CollaboratorCommitteesView({ committees, myActions }: Props) {
  return (
    <div className="flex flex-col gap-10">
      {/* Section 1 — Mes Comités */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Mes Comités</h2>
          <p className="mt-0.5 text-xs text-gray500">
            {committees.length > 0
              ? `${committees.length} comité${committees.length > 1 ? "s" : ""} dont vous êtes membre`
              : "Vous n'êtes membre d'aucun comité."}
          </p>
        </div>
        {committees.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {committees.map((committee) => (
              <MyCommitteeCard key={committee.id} committee={committee} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12">
            <p className="text-sm text-gray400">Aucun comité pour le moment.</p>
          </div>
        )}
      </section>

      {/* Section 2 — Mes Actions de Comités */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Mes Actions de Comités</h2>
          <p className="mt-0.5 text-xs text-gray500">
            {myActions.length > 0
              ? `${myActions.length} action${myActions.length > 1 ? "s" : ""} vous sont assignées`
              : "Aucune action ne vous est assignée."}
          </p>
        </div>
        <MyCommitteeActionsList actions={myActions} />
      </section>
    </div>
  );
}
