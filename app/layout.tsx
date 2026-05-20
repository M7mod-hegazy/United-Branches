import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'الفروع المتحدة — إدارة المخزون الموحد',
  description: 'نظام إدارة ومتابعة مخزون الفروع الموحد بتقارير ذكية ومرونة فائقة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} font-sans`}>
      <body
        suppressHydrationWarning
        className="bg-[#FCFAF7] text-[#1E2229] antialiased"
      >
        <header className="border-b border-[#EAE8E4] bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-[#1E2229] transition-colors group-hover:text-[#A88554]">
                الفروع المتحدة
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <Link className="text-[#78726A] hover:text-[#1E2229] transition-colors relative py-1" href="/">
                المعاينة
              </Link>
              <Link className="text-[#78726A] hover:text-[#1E2229] transition-colors relative py-1" href="/upload">
                رفع ملف
              </Link>
              <Link className="text-[#78726A] hover:text-[#1E2229] transition-colors relative py-1" href="/admin">
                الفروع
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">{children}</main>
      </body>
    </html>
  )
}

