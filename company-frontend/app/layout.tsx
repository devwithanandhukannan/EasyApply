// app/layout.tsx
import { AuthProvider } from '@/app/contexts/AuthContext';
import '@/app/globals.css';

export const metadata = {
  title: 'Company Dashboard',
  description: 'Manage your workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}