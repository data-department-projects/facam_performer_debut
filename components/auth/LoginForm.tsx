"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Email ou mot de passe incorrect.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-facamBlack">
          Adresse email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@facam-stairway.com"
          autoComplete="email"
          className="border-gray300 focus:border-facamBlue focus:ring-facamBlue/20"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-facamBlack"
        >
          Mot de passe
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            className="border-gray300 pr-10 focus:border-facamBlue focus:ring-facamBlue/20"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray400 hover:text-gray600"
            tabIndex={-1}
            aria-label={
              showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-facamBlue text-facamWhite hover:bg-facamDark"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </Button>

        <a
          href="/reset-password"
          className="text-center text-sm text-gray500 hover:text-facamBlue hover:underline"
        >
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  );
}
