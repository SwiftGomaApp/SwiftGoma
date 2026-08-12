export default function OrderTrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
  );
}
