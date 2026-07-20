// app/layout.tsx
import { AuthProvider } from '@/app/contexts/AuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer'; 
import '@/app/globals.css';

export const metadata = {
  title: 'EasyApply for Business — Hire Smarter, Faster',
  description: 'Enterprise hiring platform for managing candidate pipelines, running live technical interviews, and deploying AI-powered job matching.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#030508] text-white antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}