'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, TrendingUp, Copy, Shield, BarChart3, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  const t = useTranslations('landing')
  const features = [
    { icon: Zap, key: 'aiSignals' },
    { icon: Copy, key: 'copyTrading' },
    { icon: Shield, key: 'riskManage' },
    { icon: BarChart3, key: 'paperTrade' },
    { icon: Users, key: 'referral' },
    { icon: TrendingUp, key: 'multiExchange' },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-900">ApexOS</h1>
        <div className="flex gap-4">
          <Link href="/vi/login" className="text-brand-700 hover:text-brand-900 font-medium">{t('nav.login')}</Link>
          <Link href="/vi/signup" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 font-medium">{t('nav.signup')}</Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-20">
        <section className="text-center mb-24">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">{t('heroTitle')}</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{t('heroSubtitle')}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/vi/signup" className="bg-brand-600 text-white px-8 py-3 rounded-lg hover:bg-brand-700 font-medium inline-flex items-center gap-2">{t('ctaPrimary')} <ArrowRight className="w-4 h-4" /></Link>
            <button className="border border-brand-600 text-brand-600 px-8 py-3 rounded-lg hover:bg-brand-50 font-medium">{t('ctaSecondary')}</button>
          </div>
        </section>
        <section>
          <h3 className="text-3xl font-bold text-center mb-12">{t('features.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon
              const feature = (t(`features.${f.key}`) as unknown) as { title: string; desc: string }
              return (
                <div key={f.key} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <Icon className="w-10 h-10 text-brand-600 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>{t('footer.rights')}</p>
      </footer>
    </div>
  )
}
