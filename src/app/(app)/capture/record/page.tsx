"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUpload, Mic, MicOff, Pause, Play, Square, Trash2 } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { createIdea, uid, ValidationError } from "@/lib/repo";
import { CancelLink, EditorFrame } from "@/components/editor-frame";
import { useAfterCapture, useLeave } from "@/components/use-after-capture";
import { Button, cx, Sheet } from "@/components/ui";

type Phase = "idle" | "recording" | "paused" | "done" | "denied";
const BARS = 9;

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

/** Record_Voice — audio is kept as recorded; transcription only happens later on request (VOICE-01). */
export default function RecordVoicePage() {
  const after = useAfterCapture();
  const leave = useLeave();
  const [clientId] = useState(uid);
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.15));
  const [audio, setAudio] = useState<{ blob: Blob; ms: number; url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const acc = useRef(0);
  const raf = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const discard = useRef(false);

  function teardown() {
    cancelAnimationFrame(raf.current);
    rec.current?.stream.getTracks().forEach((tr) => tr.stop());
    void ctx.current?.close();
    ctx.current = null;
  }

  async function start() {
    setError(null);
    discard.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      acc.current = 0;
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        teardown();
        if (discard.current) return;
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setAudio({ blob, ms: acc.current, url: URL.createObjectURL(blob) });
        setPhase("done");
      };
      // Live level meter for the waveform bars.
      const ac = new AudioContext();
      const an = ac.createAnalyser();
      an.fftSize = 64;
      ac.createMediaStreamSource(stream).connect(an);
      ctx.current = ac;
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        setLevels(Array.from({ length: BARS }, (_, i) => Math.max(0.12, buf[(i * 2 + 1) % buf.length] / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
      r.start(500);
      rec.current = r;
      startedAt.current = Date.now();
      setPhase("recording");
    } catch {
      setPhase("denied");
    }
  }

  const pause = () => {
    rec.current?.pause();
    acc.current += Date.now() - startedAt.current;
    setPhase("paused");
  };
  const resume = () => {
    rec.current?.resume();
    startedAt.current = Date.now();
    setPhase("recording");
  };
  const stop = () => {
    if (phase === "recording") acc.current += Date.now() - startedAt.current;
    rec.current?.stop();
  };
  const remove = () => {
    discard.current = true;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    if (audio) URL.revokeObjectURL(audio.url);
    setAudio(null);
    setElapsed(0);
    setLevels(Array(BARS).fill(0.15));
    setPhase("idle");
  };

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setElapsed(acc.current + Date.now() - startedAt.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  // Leaving the page (or it being hidden) ends the recording cleanly.
  useEffect(
    () => () => {
      if (rec.current && rec.current.state !== "inactive") rec.current.stop();
      teardown();
    },
    [],
  );

  async function save() {
    if (!audio) return;
    setSaving(true);
    setError(null);
    try {
      const idea = await createIdea({ clientId, title, attachments: [{ kind: "audio", blob: audio.blob, duration_ms: audio.ms, file_name: "recording.webm" }] });
      after(idea.id, false);
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      setError(t(key as CopyKey, limit ? { limit } : undefined));
      setSaving(false);
    }
  }

  const status = phase === "recording" ? t("record.recording") : phase === "paused" ? t("record.paused") : phase === "done" ? t("record.done") : t("record.ready");
  const shown = phase === "done" ? (audio?.ms ?? 0) : elapsed;

  return (
    <EditorFrame
      title={t("editor.record")}
      onClose={leave}
      primary={t("action.save_idea")}
      onPrimary={save}
      primaryDisabled={!audio}
      saving={saving}
      secondary={<CancelLink onClick={leave} className="hidden lg:inline" />}
      footer={
        <div className="flex items-center justify-between pb-4 lg:justify-center lg:pb-0">
          <p className="flex items-center gap-3 text-[9px] font-black tracking-widest text-muted/50 uppercase">
            <CloudUpload className="size-3.5" aria-hidden /> {t("record.offline")}
          </p>
          <CancelLink onClick={leave} className="lg:hidden" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-xl flex-col items-center px-8 pt-10 pb-12 text-center lg:pt-4">
        <label htmlFor="r-title" className="sr-only">
          {t("capture.title.label")}
        </label>
        <input
          id="r-title"
          placeholder={t("capture.title.label")}
          className="w-full bg-transparent text-center text-3xl font-black tracking-tighter placeholder:text-muted/30 focus:outline-none lg:text-2xl"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="mt-3 text-sm font-medium text-muted/60 italic">{t("capture.menu.record.sub")}</p>

        <div className="my-12 flex h-40 items-center gap-2 lg:my-8 lg:h-28" aria-hidden>
          {levels.map((l, i) => {
            const centre = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2 + 1);
            return (
              <span
                key={i}
                className={cx("w-1 rounded-full transition-[height] duration-100", i % 2 ? "bg-primary/40" : "bg-primary")}
                style={{ height: `${Math.round((phase === "recording" ? l : 0.18) * centre * 100 + 12)}%` }}
              />
            );
          })}
        </div>

        <p className="text-6xl font-black tracking-tighter tabular-nums lg:text-5xl" aria-live="off">
          {clock(shown)}
        </p>
        <p className="mt-3 flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-primary uppercase" role="status">
          <span className={cx("size-2 rounded-full bg-primary", phase === "recording" && "animate-pulse")} /> {status}
        </p>

        {phase === "done" && audio && <audio controls src={audio.url} className="mt-8 w-full" />}

        <div className="mt-12 flex items-center justify-center gap-10 lg:mt-10">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={remove}
              disabled={phase === "idle"}
              aria-label={t("record.delete")}
              className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition-transform active:scale-90 disabled:opacity-40"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
            <span className="text-[10px] font-black tracking-widest text-muted/60 uppercase" aria-hidden>
              {t("record.delete")}
            </span>
          </div>
          <button
            onClick={phase === "recording" ? pause : phase === "paused" ? resume : phase === "idle" ? start : undefined}
            disabled={phase === "done"}
            aria-label={phase === "recording" ? t("record.pause") : phase === "paused" ? t("record.resume") : t("record.start")}
            className="flex size-24 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-8 shadow-primary/20 ring-primary/10 transition-transform active:scale-95 disabled:opacity-40"
          >
            {phase === "recording" ? <Pause className="size-9" fill="currentColor" aria-hidden /> : phase === "paused" ? <Play className="size-9" fill="currentColor" aria-hidden /> : <Mic className="size-9" aria-hidden />}
          </button>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={stop}
              disabled={phase !== "recording" && phase !== "paused"}
              aria-label={t("record.stop")}
              className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-primary shadow-sm transition-transform active:scale-90 disabled:opacity-40"
            >
              <Square className="size-5" fill="currentColor" aria-hidden />
            </button>
            <span className="text-[10px] font-black tracking-widest text-muted/60 uppercase" aria-hidden>
              {t("record.stop")}
            </span>
          </div>
        </div>
        <p className="mt-10 max-w-xs text-xs text-muted">{t("capture.record.hint")}</p>
        {error && (
          <p role="alert" className="mt-6 rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <Sheet open={phase === "denied"} onClose={leave} title={t("record.denied.title")} size="sm" icon={<MicOff className="size-4" aria-hidden />}>
        <p className="text-sm leading-relaxed text-muted">{t("record.denied.body")}</p>
        <div className="mt-6 flex flex-col gap-3 pb-4 sm:flex-row-reverse">
          <Button onClick={() => void start()}>{t("record.denied.retry")}</Button>
          <Button variant="secondary" onClick={leave}>
            {t("record.denied.back")}
          </Button>
        </div>
      </Sheet>
    </EditorFrame>
  );
}
