import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-facamBlueTint px-4">
      <div className="w-full max-w-md">
        {/* Logo / En-tête */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/facam_stairway-bleu.png"
              alt="FACAM STAIRWAY"
              width={220}
              height={152}
              priority
              className="h-auto w-[220px]"
            />
          </div>
          <h1 className="text-xl font-bold text-facamDark">FACAM PERFORMER</h1>
          <p className="mt-1 text-sm text-gray500">
            Plateforme de gestion de la performance
          </p>
        </div>

        {/* Card connexion */}
        <div className="rounded-xl border border-gray200 bg-facamWhite p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-facamDark">
            Connexion
          </h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray400">
          © {new Date().getFullYear()} FACAM STAIRWAY. Accès réservé aux
          utilisateurs autorisés.
        </p>
      </div>
    </div>
  );
}
