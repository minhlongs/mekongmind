'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations('auth')
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <Link href="/vi" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('loginTitle')}</h1>
        {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <div className="flex justify-end">
            <Link href="/vi/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">{t('forgotPassword')}</Link>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium">{loading ? '...' : t('submitLogin')}</button>
        </form>
        <p className="text-center text-gray-600 mt-6">{t('noAccount')} <Link href="/vi/signup" className="text-brand-600 hover:text-brand-700 font-medium">{t('signup')}</Link></p>
      </div>
    </div>
  )
}
