import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miguelacm.es/tools/text-to-speech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA",
    template: "%s | Text to Speech",
  },
  description:
    "Convierte texto a voz online gratis con dos motores: voces del sistema de tu navegador (instantáneo) o modelos de IA neuronal MMS en 6 idiomas (descargable en WAV). Sin registro, sin límite de texto.",
  keywords: [
    "texto a voz online gratis",
    "text to speech gratis online",
    "conversor tts español",
    "voz ia texto a audio",
    "text to speech descargar audio",
    "narrador de texto online",
  ],
  authors: [{ name: "Miguel Ángel Colorado Marin", url: "https://miguelacm.es" }],
  creator: "Miguel Ángel Colorado Marin",
  openGraph: {
    title: "Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA",
    description:
      "Convierte texto a voz con voces del sistema o IA neuronal descargable en 6 idiomas. Por MACM.",
    url: SITE_URL,
    siteName: "Text to Speech — MACM",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA",
    description: "Texto a voz gratis: motor del sistema o IA neuronal descargable. Por MACM · miguelacm.es",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="author" href="https://miguelacm.es" />
        <meta name="author" content="Miguel Ángel Colorado Marin" />
        <meta name="copyright" content="Miguel Ángel Colorado Marin — miguelacm.es" />
      </head>
      <body className="antialiased">
        {children}
        <footer className="pb-8 text-center text-xs text-text-muted/40">
          ⚡ por{" "}
          <a
            href="https://miguelacm.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted/60 transition-colors hover:text-text-muted underline-offset-2 hover:underline"
          >
            MACM · miguelacm.es
          </a>
          {" · "}
          <a
            href="https://github.com/m-a-c-m/TextToSpeech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted/60 transition-colors hover:text-text-muted underline-offset-2 hover:underline"
          >
            Código abierto
          </a>
        </footer>
      </body>
    </html>
  );
}
