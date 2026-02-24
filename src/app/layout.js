import './globals.css'

export const metadata = {
  title: 'SKYBIN — Drone Asset Manager',
  description: 'AI-powered drone footage DAM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
