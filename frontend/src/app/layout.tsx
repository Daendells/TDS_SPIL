import type { Metadata } from "next";
import "./globals.css";
import TopLoader from "@/components/top-loader";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Talent Development System",
  description: "A web application for managing talent development.",
  icons: {
    icon: "/images/logo1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <TopLoader />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
