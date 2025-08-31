import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeToggle, Logo } from '@/components'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import { Meteors } from '@/components/magicui/meteors'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Pokernaut',
  description: 'Navigate your estimates with confidence',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen bg-background flex flex-col`}
      >
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <Logo size="md" />
                </Link>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 flex">{children}</main>
        <Toaster position="bottom-right" />
        <div className="absolute inset-0 overflow-hidden -z-50">
          <Meteors
            number={2}
            minDuration={0.6}
            maxDuration={1.2}
            minDelay={30}
            maxDelay={90}
          />
        </div>
      </body>
    </html>
  )
}
