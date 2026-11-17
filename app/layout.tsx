import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Moment — a little space to reflect",
  description:
    "A gentle journal that remembers what matters and picks up where you left off.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
