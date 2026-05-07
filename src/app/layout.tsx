import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import 'leaflet/dist/leaflet.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpotlexWorld | Smart Waste Management',
  description: 'The premium waste management platform for a cleaner world.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#fcfcfc] text-slate-900 antialiased`}>
        {children}
        <Toaster position="top-center" richColors expand={true} duration={5000} />
      </body>
    </html>
  )
}