import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Dark Orden — Guild Command Center",
    description:
      "Защищённый цифровой штаб гильдии Dark Orden: аккаунты участников, события и подключение профиля Discord.",
    icons: { icon: "/og.png" },
    openGraph: {
      title: "Dark Orden — Guild Command Center",
      description: "Цифровой штаб гильдии Dark Orden.",
      type: "website",
      locale: "ru_RU",
      images: [
        {
          url: new URL("/og-planner.png", origin).toString(),
          width: 1672,
          height: 941,
          alt: "Dark Orden Guild Command Center",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Dark Orden — Guild Command Center",
      description: "Цифровой штаб гильдии Dark Orden.",
      images: [new URL("/og-planner.png", origin).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
