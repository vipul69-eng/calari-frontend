import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/wrappers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { HydrationWrapper } from "@/wrappers/hydration-wrapper";
import { OuterLoading } from "@/components/ui/loading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calari - AI Food Tracker",
  description:
    "Calari is an AI-powered food tracker that helps you monitor your calorie intake and provides detailed nutritional analysis.",
  manifest: "/manifest.json",
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "/icon-192x192.jpg" },
    { rel: "icon", url: "/icon-192x192.jpg" },
  ],
  applicationName: "Calari",
  keywords: [
    "food tracker",
    "calorie counter",
    "nutrition tracker",
    "AI food analysis",
  ],
  authors: [{ name: "Calari Team", url: "https://calari.in" }],
  themeColor: "#000000",
  openGraph: {
    type: "website",
    url: "https://www.calari.in",
    title: "Calari - AI Food Tracker",
    description:
      "Track your food intake with the power of AI. Get detailed nutritional analysis and insights.",
    images: [
      {
        url: "https://www.calari.in/icon-512x512.jpg", // <-- absolute URL!
        width: 512,
        height: 512,
        alt: "Calari Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calari - AI Food Tracker",
    description:
      "Track your food intake with the power of AI. Get detailed nutritional analysis and insights.",
    images: ["https://www.calari.in/icon-512x512.jpg"], // <-- absolute URL!
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS fullscreen with translucent status bar */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Calari" />
        <link rel="apple-touch-icon" href="/icon-192x192.jpg" />
        {/* transparent status bar on Android */}
        <meta name="theme-color" content="rgba(0,0,0,0)" />
        <meta name="background-color" content="transparent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2732-2048.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1668-2388.jpg"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2388-1668.jpg"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1536-2048.jpg"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2048-1536.jpg"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1640-2360.jpg"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2360-1640.jpg"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1668-2224.jpg"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2224-1668.jpg"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1620-2160.jpg"
          media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2160-1620.jpg"
          media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1488-2266.jpg"
          media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2266-1488.jpg"
          media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1320-2868.jpg"
          media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2868-1320.jpg"
          media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1206-2622.jpg"
          media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2622-1206.jpg"
          media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1290-2796.jpg"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2796-1290.jpg"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1179-2556.jpg"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2556-1179.jpg"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2532-1170.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1284-2778.jpg"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2778-1284.jpg"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1125-2436.jpg"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2436-1125.jpg"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1242-2688.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2688-1242.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-828-1792.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1792-828.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1242-2208.jpg"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-2208-1242.jpg"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-750-1334.jpg"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1334-750.jpg"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-640-1136.jpg"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/public/splash/apple-splash-1136-640.jpg"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "transparent" }}
      >
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <HydrationWrapper>
              <Toaster />
              {children}
            </HydrationWrapper>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
