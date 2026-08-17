import { AuthProvider } from '@/app/contexts/AuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer'; 
import { ThemeProvider } from '@/app/lib/theme';
import '@/app/globals.css';

export const metadata = {
  title: 'EasyApply for Business — Hire Smarter, Faster',
  description: 'Enterprise hiring platform for managing candidate pipelines, running live technical interviews, and deploying AI-powered job matching.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
      <body className="antialiased" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--foreground)' }} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}