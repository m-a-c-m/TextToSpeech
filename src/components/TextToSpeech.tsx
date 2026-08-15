"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FiPlay, FiPause, FiSquare, FiAlertTriangle, FiDownload, FiLoader } from "react-icons/fi";
import { MdRecordVoiceOver, MdAutoAwesome } from "react-icons/md";

interface Props { locale?: string; }

// Chrome silently truncates very long single utterances (and can stall after
// long background tabs) — splitting into sentence-sized utterances and
// chaining them via the "end" event sidesteps both issues and gives natural
// pauses between sentences for free. No hard cap on total text length: it's
// only as slow as the device reading it, never artificially blocked.
const SYSTEM_CHUNK_MAX = 200;
const AI_CHUNK_MAX = 300;

function splitIntoChunks(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

type Engine = "system" | "ai";
type AiStage = "idle" | "loadingModel" | "processing" | "done" | "error";

// MMS (Massively Multilingual Speech) VITS models — one per language, real
// neural TTS instead of whatever voice happens to be installed on the OS.
// Produces actual audio data (unlike the Web Speech API), so this is also
// the only mode that can offer a download.
const AI_MODELS: Record<string, string> = {
  es: "Xenova/mms-tts-spa",
  en: "Xenova/mms-tts-eng",
  fr: "Xenova/mms-tts-fra",
  de: "Xenova/mms-tts-deu",
  it: "Xenova/mms-tts-ita",
  pt: "Xenova/mms-tts-por",
};

const AI_LANGUAGES: { code: string; labelEs: string; labelEn: string }[] = [
  { code: "es", labelEs: "Español", labelEn: "Spanish" },
  { code: "en", labelEs: "Inglés", labelEn: "English" },
  { code: "fr", labelEs: "Francés", labelEn: "French" },
  { code: "de", labelEs: "Alemán", labelEn: "German" },
  { code: "it", labelEs: "Italiano", labelEn: "Italian" },
  { code: "pt", labelEs: "Portugués", labelEn: "Portuguese" },
];

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

let reqCounter = 0;
function runTtsInWorker(
  worker: Worker,
  payload: { text: string; modelId: string },
  onProgress: (pct: number) => void,
  onProcessing: () => void,
): Promise<{ audio: Float32Array; samplingRate: number }> {
  return new Promise((resolve, reject) => {
    const reqId = ++reqCounter;
    const handler = (e: MessageEvent) => {
      const m = e.data as { type: string; reqId: number; pct?: number; audio?: ArrayBuffer; samplingRate?: number; message?: string };
      if (m.reqId !== reqId) return;
      if (m.type === "progress") onProgress(m.pct ?? 0);
      else if (m.type === "processing") onProcessing();
      else if (m.type === "done") {
        worker.removeEventListener("message", handler);
        resolve({ audio: new Float32Array(m.audio!), samplingRate: m.samplingRate! });
      } else if (m.type === "error") {
        worker.removeEventListener("message", handler);
        reject(new Error(m.message ?? "error"));
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({ type: "run", reqId, text: payload.text, modelId: payload.modelId });
  });
}

export default function TextToSpeech({ locale = "es" }: Props) {
  const isEs = locale === "es";

  const [text, setText] = useState(
    isEs
      ? "Escribe o pega aquí el texto que quieres escuchar."
      : "Type or paste the text you want to hear."
  );
  const [engine, setEngine] = useState<Engine>("system");

  // ── System voices (Web Speech API) ──────────────────────────────────────
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const queueRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const stoppedRef = useRef(false);

  // ── AI voices (local neural TTS) ─────────────────────────────────────────
  const [aiLanguage, setAiLanguage] = useState(isEs ? "es" : "en");
  const [aiStage, setAiStage] = useState<AiStage>("idle");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const aiResultUrlRef = useRef<string | null>(null);
  const aiWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setUnsupported(true);
      return;
    }
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length === 0) return;
      setVoices(list);
      setVoiceURI((current) => {
        if (current) return current;
        const langPrefix = isEs ? "es" : "en";
        const match = list.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        return (match ?? list[0]).voiceURI;
      });
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isEs]);

  useEffect(() => {
    return () => {
      if (aiResultUrlRef.current) URL.revokeObjectURL(aiResultUrlRef.current);
      aiWorkerRef.current?.terminate();
    };
  }, []);

  const setAiResultUrlSafe = (url: string | null) => {
    if (aiResultUrlRef.current) URL.revokeObjectURL(aiResultUrlRef.current);
    aiResultUrlRef.current = url;
    setAiResultUrl(url);
  };

  const speakNextChunk = useCallback(() => {
    if (stoppedRef.current) return;
    const i = chunkIndexRef.current;
    const chunks = queueRef.current;
    if (i >= chunks.length) {
      setSpeaking(false);
      setPaused(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[i]);
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.onend = () => {
      if (stoppedRef.current) return;
      chunkIndexRef.current += 1;
      speakNextChunk();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  }, [voices, voiceURI, rate, pitch, volume]);

  const handlePlay = useCallback(() => {
    if (!text.trim()) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      return;
    }
    window.speechSynthesis.cancel();
    stoppedRef.current = false;
    queueRef.current = splitIntoChunks(text, SYSTEM_CHUNK_MAX);
    chunkIndexRef.current = 0;
    setSpeaking(true);
    setPaused(false);
    speakNextChunk();
  }, [text, paused, speakNextChunk]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const generateAi = useCallback(async () => {
    if (!text.trim()) return;
    setAiError(null);
    setAiResultUrlSafe(null);
    setAiStage("loadingModel");
    setAiProgress(0);

    try {
      if (!aiWorkerRef.current) {
        aiWorkerRef.current = new Worker(new URL("./ttsGenerate.worker.ts", import.meta.url), { type: "module" });
      }
      const worker = aiWorkerRef.current;
      const modelId = AI_MODELS[aiLanguage] ?? AI_MODELS.en;
      const chunks = splitIntoChunks(text, AI_CHUNK_MAX);

      const parts: Float32Array[] = [];
      let samplingRate = 16000;
      for (let i = 0; i < chunks.length; i++) {
        const result = await runTtsInWorker(
          worker,
          { text: chunks[i], modelId },
          (pct) => setAiProgress(pct),
          () => setAiStage("processing"),
        );
        samplingRate = result.samplingRate;
        parts.push(result.audio);
        if (i < chunks.length - 1) parts.push(new Float32Array(Math.round(samplingRate * 0.25)));
      }

      const total = parts.reduce((a, p) => a + p.length, 0);
      const combined = new Float32Array(total);
      let off = 0;
      for (const p of parts) { combined.set(p, off); off += p.length; }

      const blob = encodeWav(combined, samplingRate);
      setAiResultUrlSafe(URL.createObjectURL(blob));
      setAiStage("done");
    } catch (e) {
      console.error("AI TTS error:", e);
      setAiStage("error");
      setAiError(
        isEs
          ? "No se pudo generar el audio con IA. Prueba con menos texto o vuelve a intentarlo."
          : "Couldn't generate audio with AI. Try less text or try again."
      );
    }
  }, [text, aiLanguage, isEs]);

  if (unsupported && engine === "system") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <FiAlertTriangle className="shrink-0" />
        {isEs
          ? "Tu navegador no soporta la Web Speech API. Prueba con Chrome, Edge o Safari recientes."
          : "Your browser doesn't support the Web Speech API. Try a recent Chrome, Edge or Safari."}
      </div>
    );
  }

  const voicesByLang = voices.reduce<Record<string, SpeechSynthesisVoice[]>>((acc, v) => {
    (acc[v.lang] ??= []).push(v);
    return acc;
  }, {});

  const btnToggle = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-primary/50 bg-primary/10 text-primary"
        : "border-border/30 bg-surface/60 text-text-muted hover:text-text"
    }`;

  const aiBusy = aiStage === "loadingModel" || aiStage === "processing";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={isEs ? "Escribe o pega tu texto aquí…" : "Type or paste your text here…"}
          className="w-full resize-y rounded-xl border border-border/30 bg-surface/60 px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:border-primary/50 focus:outline-none"
        />
        <p className="text-right text-xs text-text-muted/50">
          {text.length.toLocaleString(isEs ? "es-ES" : "en-US")} {isEs ? "caracteres — sin límite, solo el que aguante tu equipo" : "characters — no limit, only what your device can handle"}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-muted">{isEs ? "Motor de voz" : "Voice engine"}</label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEngine("system")} className={btnToggle(engine === "system")}>
            {isEs ? "Voces del sistema (instantáneo)" : "System voices (instant)"}
          </button>
          <button onClick={() => setEngine("ai")} className={btnToggle(engine === "ai")}>
            <MdAutoAwesome className="mr-1 inline" /> {isEs ? "IA local (descarga modelo)" : "Local AI (downloads model)"}
          </button>
        </div>
      </div>

      {engine === "system" ? (
        <div className="space-y-4 rounded-xl border border-border/20 bg-surface/30 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">{isEs ? "Voz" : "Voice"}</label>
            <select
              value={voiceURI}
              onChange={(e) => setVoiceURI(e.target.value)}
              className="w-full rounded-lg border border-border/30 bg-surface/60 px-3 py-2 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              {Object.entries(voicesByLang).map(([lang, list]) => (
                <optgroup key={lang} label={lang}>
                  {list.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {voicesByLang && Object.values(voicesByLang).flat().length <= 2 && (
              <p className="mt-2 text-xs text-yellow-400/80">
                {isEs
                  ? "Tu sistema solo tiene 1-2 voces instaladas — por eso cambiar la voz apenas se nota. Prueba el motor de IA local para una voz más natural y variada."
                  : "Your system only has 1-2 voices installed — that's why switching voice barely changes anything. Try the local AI engine for a more natural, varied voice."}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">{isEs ? "Velocidad" : "Rate"}: {rate.toFixed(1)}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">{isEs ? "Tono" : "Pitch"}: {pitch.toFixed(1)}</label>
              <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">{isEs ? "Volumen" : "Volume"}: {Math.round(volume * 100)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-primary" />
            </div>
          </div>

          <div className="flex gap-2">
            {!speaking || paused ? (
              <button
                onClick={handlePlay}
                disabled={!text.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <FiPlay /> {paused ? (isEs ? "Reanudar" : "Resume") : (isEs ? "Escuchar" : "Play")}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <FiPause /> {isEs ? "Pausar" : "Pause"}
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!speaking}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-surface/40 px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:text-text disabled:opacity-40"
            >
              <FiSquare /> {isEs ? "Detener" : "Stop"}
            </button>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-text-muted/50">
            <MdRecordVoiceOver className="mt-0.5 shrink-0" />
            {isEs
              ? "Usa el motor de voz de tu propio sistema — por eso no hay descarga: el navegador no permite capturar ese audio, solo reproducirlo. Para descargar, usa el motor de IA local."
              : "Uses your own system's voice engine — that's why there's no download: the browser doesn't allow capturing that audio, only playing it. To download, use the local AI engine."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border/20 bg-surface/30 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">{isEs ? "Idioma" : "Language"}</label>
            <select
              value={aiLanguage}
              onChange={(e) => setAiLanguage(e.target.value)}
              disabled={aiBusy}
              className="w-full rounded-lg border border-border/30 bg-surface/60 px-3 py-2 text-sm text-text focus:border-primary/50 focus:outline-none disabled:opacity-50"
            >
              {AI_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{isEs ? l.labelEs : l.labelEn}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-text-muted/50">
              {isEs
                ? "Modelo neuronal MMS (~150 MB), se descarga una vez y queda en caché para la próxima vez. Voz consistente y bien pronunciada en el idioma elegido."
                : "MMS neural model (~150 MB), downloads once and stays cached for next time. Consistent, well-pronounced voice in the chosen language."}
            </p>
          </div>

          <button
            onClick={generateAi}
            disabled={aiBusy || !text.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {aiStage === "loadingModel" && (isEs ? `Descargando modelo… ${aiProgress}%` : `Downloading model… ${aiProgress}%`)}
            {aiStage === "processing" && (<><FiLoader className="animate-spin" /> {isEs ? "Generando voz…" : "Generating voice…"}</>)}
            {!aiBusy && (<><MdAutoAwesome /> {isEs ? "Generar audio con IA" : "Generate audio with AI"}</>)}
          </button>

          {aiError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <FiAlertTriangle className="shrink-0" />
              {aiError}
            </div>
          )}

          {aiResultUrl && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <audio src={aiResultUrl} controls className="w-full" />
              <a
                href={aiResultUrl}
                download="tts.wav"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <FiDownload /> {isEs ? "Descargar .wav" : "Download .wav"}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
