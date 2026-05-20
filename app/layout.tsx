import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'United Branches',
  description: 'Unified branch inventory preview and upload system',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-950 antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-lg font-bold text-slate-950">
              United Branches
            </Link>
            <nav className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/">
                المعاينة
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/upload">
                رفع ملف
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin">
                الفروع
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  )
}
