import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['vi', 'en'] as const

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale as typeof locales[number])) notFound()
  return { locale: locale as 'vi' | 'en', messages: (await import(`./messages/${locale}.json`)).default }
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
