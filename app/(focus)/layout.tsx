/**
 * Focus Mode shell: no sidebar, no header, no chrome.
 * The editor gets the entire viewport.
 */
export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="h-dvh w-full overflow-hidden">{children}</main>;
}
