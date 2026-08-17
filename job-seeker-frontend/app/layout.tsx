import "./globals.css";
import { AuthProvider } from '@/app/contexts/AuthContext';
import { PublicAuthProvider } from '@/app/contexts/PublicAuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer'; 
import { ThemeProvider } from '@/app/lib/theme';

export const metadata = {
  title: 'EasyApply — Find Your Next Role Faster',
  description: 'AI-powered job matching platform. Build an ATS-optimized profile, clear proctored assessments, and attend real-time technical interviews.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script
          // biome-ignore lint: theme init must run before first paint
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('easyapply_theme_mode')||'light';var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(m);d.setAttribute('data-theme',m);}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--foreground)' }} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <PublicAuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </PublicAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}