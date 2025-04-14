import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { PlayerProvider } from "@/contexts/player-context";
import GlobalPlayerWrapper from "@/components/global-player-wrapper";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TibeeMusic",
  description: "Upload and play music",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PlayerProvider>
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col sm:gap-6 gap-3 items-center justify-between min-h-full">
                <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                  <div className="w-full  flex justify-between items-center sm:p-3 sm:px-5 p-2 text-sm">
                    <div className="flex gap-5 items-center font-semibold">
                      <Link href={"/"}>TibeeMusic</Link>
                    </div>

                    <div className="flex gap-2 items-center">
                      <ThemeSwitcher />
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>

                  </div>
                </nav>
                <div className="flex flex-col sm:gap-6 gap-3  w-full sm:p-5 p-1 sm:pb-32 pb-16">
                  {children}
                </div>

                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 sm:py-12 py-8">
                  <p>
                    Powered by{" "}
                    <a
                      href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                      target="_blank"
                      className="font-bold hover:underline"
                      rel="noreferrer"
                    >
                      Supabase
                    </a>
                  </p>
                </footer>
              </div>
              <GlobalPlayerWrapper />
            </main>
          </PlayerProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
