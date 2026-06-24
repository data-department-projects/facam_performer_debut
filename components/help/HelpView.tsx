"use client";

import { BookOpen, Bug } from "lucide-react";
import { FaqSection } from "./FaqSection";
import { BugReportForm } from "./BugReportForm";

export function HelpView({ role }: { role: string }) {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-facamBlue/10">
            <BookOpen className="h-5 w-5 text-facamBlue" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-facamDark">Guide d&apos;utilisation</h2>
            <p className="text-sm text-gray500">
              Questions fréquentes adaptées à votre rôle dans la plateforme.
            </p>
          </div>
        </div>
        <FaqSection role={role} />
      </section>

      <hr className="border-gray100" />

      {/* Bug report */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10">
            <Bug className="h-5 w-5 text-error" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-facamDark">Signaler un problème</h2>
            <p className="text-sm text-gray500">
              Un bug, une anomalie ou un comportement inattendu ? Décrivez-le ci-dessous.
            </p>
          </div>
        </div>
        <BugReportForm />
      </section>
    </div>
  );
}
