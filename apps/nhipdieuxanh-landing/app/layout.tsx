import './globals.css'
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({
  subsets: ['vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata = {
  title: 'Nhịp Điệu Xanh - Đô Thị Sinh Thái Đẳng Cấp Cần Thơ',
  description: 'Hệ thống căn hộ xanh thông minh, gần trường đại học, tiện ích vượt trội tại trung tâm Cái Răng & Ninh Kiều, Cần Thơ.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable} h-full scroll-smooth`}>
      <body className="font-sans antialiased text-[#111827] bg-[#F9FAFB] dark:bg-[#064E3B] dark:text-white h-full">
        {children}
      </body>
    </html>
  )
}
