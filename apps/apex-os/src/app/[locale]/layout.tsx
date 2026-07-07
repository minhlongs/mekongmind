import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'

const inter = { variable: '--font-inter' } as const

const locales = ['vi', 'en'] as const

export const metadata: Metadata = {
  title: 'ApexOS — AI Copy Trading',
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale as typeof locales[number])) notFound()
  const messages = (await import(`../../i18n/messages/${locale}.json`)).default

  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
