import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://dark-orden-guild-hub.rkvvx28vrb.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dark Orden — Guild Command Center",
  description:
    "Защищённый цифровой штаб гильдии Dark Orden: аккаунты участников, события и подключение профиля Discord.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Dark Orden — Guild Command Center",
    description: "Цифровой штаб гильдии Dark Orden.",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: `${siteUrl}/og-recurring.jpg`,
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
    images: [`${siteUrl}/og-recurring.jpg`],
  },
};

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
