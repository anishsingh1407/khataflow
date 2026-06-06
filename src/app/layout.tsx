import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Poppins } from "next/font/google";
import "./globals.css";
import DevPanel from "@/components/shared/dev-panel";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#006b2c",
};

export const metadata: Metadata = {
  title: {
    default: "KhataFlow — Digital Udhar Management",
    template: "%s | KhataFlow",
  },
  description:
    "KhataFlow is a digital udhar management system for small Indian retail businesses. Track credit, manage payments, and grow your business.",
  keywords: [
    "khataflow",
    "udhar",
    "digital ledger",
    "credit management",
    "retail",
    "bharat",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${poppins.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[var(--font-body)] antialiased">
        <AuthProvider>
          {children}
          <DevPanel />
        </AuthProvider>
      </body>
    </html>
  );
}
