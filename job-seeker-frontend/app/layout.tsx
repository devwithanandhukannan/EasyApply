import "./globals.css";
import { AuthProvider } from '@/app/contexts/AuthContext';
import { PublicAuthProvider } from '@/app/contexts/PublicAuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer'; 

export const metadata = {
  title: 'EasyApply — Find Your Next Role Faster',
  description: 'AI-powered job matching platform. Build an ATS-optimized profile, clear proctored assessments, and attend real-time technical interviews.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#020409] text-white antialiased">
        <AuthProvider>
          <PublicAuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </PublicAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}