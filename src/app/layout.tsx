import type { Metadata } from "next";
import { Barlow, Rubik, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme";
import { verifyEnvironmentConfiguration } from "@/lib/firebase/config/environments";

// Barlow - For headings (bold, modern)
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Rubik - For body text (readable, clean)
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Geist Mono - For code blocks
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "Rik Ride - University Auto Rickshaw Booking",
    template: "%s | Rik Ride"
  },
  description: "Safe and convenient auto rickshaw booking platform connecting university students with verified drivers",
  applicationName: "Rik Ride",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rik Ride",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/logo.png" }],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Rik Ride",
    title: "Rik Ride - University Auto Rickshaw Booking",
    description: "Safe and convenient auto rickshaw booking platform connecting university students with verified drivers",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Rik Ride Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Rik Ride - University Auto Rickshaw Booking",
    description: "Safe and convenient auto rickshaw booking platform connecting university students with verified drivers",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verify environment configuration on server-side only
  if (typeof window === 'undefined') {
    verifyEnvironmentConfiguration();
  }
  
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#009944" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${barlow.variable} ${rubik.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
