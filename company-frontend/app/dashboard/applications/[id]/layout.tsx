export async function generateStaticParams() {
  return [{ id: "default", applicationId: "default" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
