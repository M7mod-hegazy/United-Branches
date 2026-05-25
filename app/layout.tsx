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
        className="min-h-screen antialiased text-slate-800"
      >
        <header className="sticky top-0 z-50 border-b border-slate-200/40 bg-white/85 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1E6FBF] to-indigo-500 shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform duration-300">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-[#1E6FBF] transition-colors leading-none">
                  الفروع المتحدة
                </span>
                <span className="text-[9px] font-black text-slate-400 mt-1 tracking-wider">نظام المخزون الموحد</span>
              </div>
            </Link>
            
            <nav className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-5 text-xs font-black">
                <Link className="flex items-center gap-2 text-slate-500 hover:text-[#1E6FBF] hover:bg-slate-50 px-3 py-2 rounded-xl transition-all duration-300 group" href="/">
                  <svg className="h-4 w-4 text-slate-400 group-hover:text-[#1E6FBF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>شاشة المعاينة</span>
                </Link>
                <Link className="flex items-center gap-2 text-slate-500 hover:text-[#1E6FBF] hover:bg-slate-50 px-3 py-2 rounded-xl transition-all duration-300 group" href="/upload">
                  <svg className="h-4 w-4 text-slate-400 group-hover:text-[#1E6FBF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>رفع تقارير الفروع</span>
                </Link>
              </div>

              <Link className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-900 active:scale-95 transition-all duration-300 shadow-premium shadow-slate-900/10 hover:shadow-premium-hover" href="/admin">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>لوحة التحكم</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">{children}</main>
      </body>
    </html>
  )
}

