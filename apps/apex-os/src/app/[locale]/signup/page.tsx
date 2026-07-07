'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const t = useTranslations('auth')
  const { signUp, loading } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError(t('passwordMismatch'))
    if (!terms) return setError(t('termsRequired'))
    const { error: err } = await signUp(form.email, form.password, form.fullName)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <Link href="/vi" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('signupTitle')}</h1>
        {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
            <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="rounded border-gray-300 text-brand-600" />
            {t('termsAgree')}
          </label>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium">{loading ? '...' : t('submitSignup')}</button>
        </form>
        <p className="text-center text-gray-600 mt-6">{t('hasAccount')} <Link href="/vi/login" className="text-brand-600 hover:text-brand-700 font-medium">{t('nav.login')}</Link></p>
      </div>
    </div>
  )
}
