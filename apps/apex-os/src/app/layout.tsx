import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'ApexOS',
  description: 'AI-powered copy-trading platform for SEA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
