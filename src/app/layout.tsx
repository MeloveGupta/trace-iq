import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceIQ",
  description:
    "See exactly what your AI agent did, and why. Visual debugging for Composio execution logs.",
  keywords: ["AI", "debugging", "Composio", "tool calls", "agent", "trace"],
  openGraph: {
    title: "TraceIQ",
    description:
      "See exactly what your AI agent did, and why. Visual debugging for Composio execution logs.",
    type: "website",
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
      className="h-full"
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
