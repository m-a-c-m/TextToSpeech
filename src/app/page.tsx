import TextToSpeech from "@/components/TextToSpeech";
import { MdRecordVoiceOver } from "react-icons/md";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miguelacm.es/tools/text-to-speech";
const EMBED_URL = process.env.NEXT_PUBLIC_EMBED_URL || "https://miguelacm.es/embed/text-to-speech";

export const metadata = {
  title: "Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA",
  description:
    "Convierte texto a voz online gratis con dos motores: voces del sistema de tu navegador (instantáneo) o modelos de IA neuronal MMS en 6 idiomas (descargable en WAV). Sin registro, sin límite de texto.",
  alternates: { canonical: SITE_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA",
  url: SITE_URL,
  description:
    "Convierte texto a voz online gratis con dos motores: voces del sistema de tu navegador (instantáneo) o modelos de IA neuronal MMS en 6 idiomas (descargable en WAV). Sin registro, sin límite de texto.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  inLanguage: "es-ES",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  author: {
    "@type": "Person",
    name: "Miguel Ángel Colorado Marin",
    url: "https://miguelacm.es",
  },
  featureList: [
    "Motor de voces del sistema (Web Speech API)",
    "Motor de IA neuronal MMS descargable",
    "6 idiomas en modo IA",
    "División automática de textos largos",
    "Descarga en formato WAV (modo IA)",
    "Sin límite artificial de longitud",
    "Sin registro",
    "Código abierto",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <MdRecordVoiceOver className="text-base" />
              Herramienta gratuita · Código abierto
            </div>
            <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">
              Texto a Voz
            </h1>
            <p className="mb-2 text-lg text-text-muted">
              Convierte cualquier texto a voz con las voces de tu sistema o con IA neuronal descargable.
            </p>
            <p className="text-sm text-text-muted/60">
              Hecho por{" "}
              <a
                href="https://miguelacm.es"
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-text font-medium hover:opacity-80 transition-opacity"
              >
                MACM
              </a>{" "}
              · Sin registro · Sin anuncios · 100% en el navegador
            </p>
          </div>

          <div className="glass rounded-2xl border border-border/20 p-6 md:p-8">
            <TextToSpeech />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🗣️",
                title: "Dos motores de voz",
                desc: "Voces del sistema de tu navegador para uso instantáneo, o modelos de IA neuronal MMS para audio descargable de mayor calidad.",
              },
              {
                icon: "🌍",
                title: "6 idiomas en modo IA",
                desc: "Español, inglés, francés, alemán, italiano y portugués, cada uno con su propio modelo neuronal especializado.",
              },
              {
                icon: "📝",
                title: "Sin límite de texto",
                desc: "Los textos largos se dividen automáticamente en fragmentos por frases, sin ningún tope artificial de longitud.",
              },
            ].map((item) => (
              <div
                key={item.icon}
                className="glass rounded-xl border border-border/15 p-5"
              >
                <span className="mb-3 block text-2xl">{item.icon}</span>
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border/20 bg-white/3 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Cómo convertir texto a voz
            </h2>
            <ol className="space-y-3">
              {[
                { n: 1, text: "Escribe o pega el texto que quieres convertir a voz." },
                { n: 2, text: "Elige el motor: voces del sistema (instantáneo) o IA neuronal (descargable)." },
                { n: 3, text: "Selecciona el idioma y, en modo sistema, la voz concreta." },
                { n: 4, text: "Reproduce el resultado o descarga el audio generado en modo IA." },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {step.n}
                  </span>
                  <p className="text-sm text-text-muted leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-white">Preguntas frecuentes</h2>
            {[
              {
                q: "¿Cuál es la diferencia entre el motor del sistema y el motor de IA?",
                a: "El motor del sistema usa la Web Speech API nativa del navegador con las voces instaladas en tu sistema operativo: es instantáneo pero solo permite reproducir, no descargar. El motor de IA usa modelos neuronales MMS que generan un archivo de audio real, descargable en WAV.",
              },
              {
                q: "¿Por qué solo puedo descargar el audio en modo IA?",
                a: "La Web Speech API del navegador (modo sistema) solo expone la reproducción, no genera datos de audio manipulables. Los modelos de IA sí generan una forma de onda real que se puede codificar y descargar.",
              },
              {
                q: "¿Qué idiomas soporta el modo IA?",
                a: "Español, inglés, francés, alemán, italiano y portugués, cada uno con su propio modelo MMS (Massively Multilingual Speech) especializado.",
              },
              {
                q: "¿Hay algún límite de longitud del texto?",
                a: "No hay un tope artificial: los textos largos se dividen automáticamente en fragmentos por frases y se procesan en cadena, tanto en modo sistema como en modo IA.",
              },
              {
                q: "¿Se sube mi texto a algún servidor?",
                a: "En modo sistema no, la síntesis ocurre con la API del navegador. En modo IA, el modelo se descarga una vez a tu navegador y la generación de audio ocurre localmente, sin enviar el texto a ningún servidor externo.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-border/20 bg-white/3 p-5"
              >
                <h3 className="mb-2 font-medium text-white">{item.q}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border/20 bg-white/3 p-6">
            <h2 className="mb-2 font-semibold text-white">
              Integra el conversor de texto a voz en tu web
            </h2>
            <p className="mb-4 text-sm text-text-muted">
              Puedes embeber este conversor en cualquier web con un simple iframe.
            </p>
            <div className="mb-3 rounded-lg bg-black/40 p-3">
              <p className="mb-1 text-xs text-text-muted/60">Iframe (integración directa):</p>
              <code className="text-xs text-green-400 break-all">
                {`<iframe src="${EMBED_URL}" width="100%" height="700" style="border:none;border-radius:12px;" title="Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA — miguelacm.es" loading="lazy"></iframe>`}
              </code>
            </div>
            <div className="rounded-lg bg-black/40 p-3">
              <p className="mb-1 text-xs text-text-muted/60">
                Enlace con atribución (recomendado para backlink):
              </p>
              <code className="text-xs text-green-400 break-all">
                {`<a href="${SITE_URL}" target="_blank" rel="noopener">Conversor de texto a voz gratis por MACM</a>`}
              </code>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
