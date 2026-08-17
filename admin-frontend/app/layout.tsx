import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyApply Admin",
  description: "Platform Administration Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var m = localStorage.getItem('easyapply_theme_mode') || 'dark';
                var d = document.documentElement;
                d.classList.remove('light', 'dark');
                d.classList.add(m);
                d.setAttribute('data-theme', m);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className} style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text)' }} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
