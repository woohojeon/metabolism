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
  // Stated rather than left to the default so phones lay the page out at their
  // own width instead of at a desktop width scaled down. `maximumScale` is left
  // alone on purpose — pinch-to-zoom is how a reader enlarges a pathway diagram.
  width: 'device-width',
  initialScale: 1,
  // The page is a light one wherever it is opened. See the `light` class below.
  colorScheme: 'light',
  themeColor: 'white',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // `light` opts out of the dark palette in globals.css. The article styling
    // is written in fixed light-mode neutrals throughout — dark grey body copy,
    // white figure cards — with no `dark:` variants anywhere, so on a phone set
    // to dark mode the background alone would flip to black and take the text
    // with it. Every device gets the one palette the pages were designed in.
    <html
      lang="en"
      className={`light ${libreCaslon.variable} ${archivo.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
