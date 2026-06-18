import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FACAM PERFORMER",
  description: "Plateforme de gestion de la performance — FACAM STAIRWAY",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full bg-facamBlueTint font-montserrat antialiased">
        {children}
      </body>
    </html>
  );
}
