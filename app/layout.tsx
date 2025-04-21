import "./globals.css";

export const metadata = {
  title: "Discord Feed",
  description:
    "A unified feed interface for Discord that aggregates unread messages across all your servers into a single, organized view.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
