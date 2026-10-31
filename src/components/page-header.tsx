export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
