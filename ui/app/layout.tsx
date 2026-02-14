import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Sidebar } from '@/components/sidebar'
import { Web3Provider } from './providers/Web3Provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sovereign Agent Treasury',
  description: 'The first economically self-sufficient AI agent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}