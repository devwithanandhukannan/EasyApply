export async function generateStaticParams() {
  return [{ id: "default", code: "default", company: "default", jobId: "default" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
