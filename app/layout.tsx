import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Libre_Caslon_Display, Archivo } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const libreCaslon = Libre_Caslon_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
})

const archivo = Archivo({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'The Metabolic Map | Veterinary Biochemistry',
  description:
    'An interactive metabolic pathway map for Veterinary Biochemistry — carbohydrate, lipid, protein, and nucleic acid metabolism.',
  generator: 'v0.app',
  // One SVG for every size: it carries its own light/dark handling, so the
  // per-scheme PNGs it used to sit behind would only have overridden it with
  // the old artwork.
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${libreCaslon.variable} ${archivo.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
