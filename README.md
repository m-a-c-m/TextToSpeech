# 🗣️ Text to Speech — Conversor de texto a voz

**Free Text to Speech Converter.** Convert text to speech with two engines: your browser's system voices (instant playback) or neural AI MMS models in 6 languages (downloadable WAV). No sign-up, no ads, 100% client-side.

🌐 **Demo en vivo / Live demo:** [miguelacm.es/tools/text-to-speech](https://miguelacm.es/tools/text-to-speech)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

- **2 motores / 2 engines:** system voices (Web Speech API) or neural AI (Transformers.js)
- **6 idiomas IA / 6 AI languages:** Spanish, English, French, German, Italian, Portuguese
- **Descarga en modo IA / Downloadable in AI mode:** real WAV audio file, not just playback
- **Sin límite / No limit:** long text auto-splits into sentence chunks
- **Sin servidor / Zero server:** Everything runs in the browser — nothing is ever uploaded
- **Embebible / Embeddable:** Use it as an iframe on any website
- **Open source:** MIT license, use it freely

---

## 🚀 Quick start

```bash
git clone https://github.com/m-a-c-m/TextToSpeech.git
cd TextToSpeech
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (optional)

```env
NEXT_PUBLIC_SITE_URL=https://miguelacm.es/tools/text-to-speech
NEXT_PUBLIC_EMBED_URL=https://miguelacm.es/embed/text-to-speech
```

---

## 📦 Embed on your website

### Iframe (plug & play)

```html
<iframe
  src="https://miguelacm.es/embed/text-to-speech"
  width="100%"
  height="700"
  style="border:none;border-radius:12px;"
  title="Texto a Voz Online Gratis — Conversor TTS con Voces del Sistema y IA — miguelacm.es"
  loading="lazy"
></iframe>
```

### Link with attribution (recommended for backlink)

```html
<a href="https://miguelacm.es/tools/text-to-speech" target="_blank" rel="noopener">
  Conversor de texto a voz gratis por MACM
</a>
```

> 💡 The link option generates a real backlink that benefits the project. Recommended if your platform supports custom HTML.

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | React framework + SSG |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling |
| [react-icons](https://react-icons.github.io/react-icons/) | 5 | Icons |
| [Transformers.js](https://huggingface.co/docs/transformers.js) | 4 | AI model inference (in-browser) |

---

## 📄 License

MIT © [Miguel Ángel Colorado Marin (MACM)](https://miguelacm.es)

Built with ❤️ by **[MACM](https://miguelacm.es)** — Full Stack Developer & Cybersecurity Specialist from Guadalajara, Spain.

- 🌐 Portfolio: [miguelacm.es](https://miguelacm.es)
- 💼 LinkedIn: [linkedin.com/in/macm](https://www.linkedin.com/in/macm/)
- 🐙 GitHub: [github.com/m-a-c-m](https://github.com/m-a-c-m)
