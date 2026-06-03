import "./globals.css";
import { AuthProvider } from '@/app/contexts/AuthContext';
import { PublicAuthProvider } from '@/app/contexts/PublicAuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer'; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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