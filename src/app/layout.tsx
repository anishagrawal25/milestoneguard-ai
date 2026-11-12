import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/context/role-context";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/navigation/footer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MilestoneGuard AI | Verified Milestone Payments",
  description:
    "Work gets verified against what was promised. Payments move forward with evidence, not guesswork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        <RoleProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <Toaster position="top-right" richColors />
        </RoleProvider>
      </body>
    </html>
  );
}
