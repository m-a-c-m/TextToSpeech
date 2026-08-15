/// <reference lib="webworker" />
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

interface TtsOut { audio: Float32Array; sampling_rate: number; }
type Pipe = (text: string) => Promise<TtsOut>;

const cache: Record<string, Promise<Pipe> | undefined> = {};

async function getPipe(modelId: string, onProgress: (p: number) => void): Promise<Pipe> {
  const cached = cache[modelId];
  if (cached) return cached;
  const built = (async () => {
    const totals: Record<string, number> = {};
    const loaded: Record<string, number> = {};
    const p = await pipeline("text-to-speech", modelId, {
      progress_callback: (x: { status?: string; file?: string; loaded?: number; total?: number }) => {
        if (x.status === "progress" && x.file && x.total) {
          totals[x.file] = x.total;
          loaded[x.file] = x.loaded ?? 0;
          const t = Object.values(totals).reduce((a, b) => a + b, 0);
          const l = Object.values(loaded).reduce((a, b) => a + b, 0);
          if (t > 0) onProgress(Math.min(99, Math.round((l / t) * 100)));
        }
      },
    });
    return p as unknown as Pipe;
  })();
  cache[modelId] = built;
  return built;
}

self.onmessage = async (e: MessageEvent) => {
  const m = e.data as { type: string; reqId: number; text: string; modelId: string };
  if (m.type !== "run") return;
  const { reqId, text, modelId } = m;
  try {
    const pipe = await getPipe(modelId, (pct) => self.postMessage({ type: "progress", reqId, pct }));
    self.postMessage({ type: "processing", reqId });
    const out = await pipe(text);
    const audio = out.audio;
    self.postMessage({ type: "done", reqId, audio: audio.buffer, samplingRate: out.sampling_rate }, [audio.buffer]);
  } catch (err) {
    delete cache[modelId];
    self.postMessage({ type: "error", reqId, message: err instanceof Error ? err.message : String(err) });
  }
};
