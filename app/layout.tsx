import type { Metadata } from "next";
import { Playfair, Playfair_Display, Inter, Eczar } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ClientProviders } from "@/components/ClientProviders";

// Serif running text. Playfair is the Playfair Display design with an
// optical-size axis, so at body sizes it is drawn with lower contrast.
const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Serif headings keep the display cut (see globals.css).
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const eczar = Eczar({
  variable: "--font-eczar",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Physical Lab",
  description: "Hardware Hacking Research Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${playfairDisplay.variable} ${inter.variable} ${eczar.variable} antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}
      >
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

