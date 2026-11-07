"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AlignLeft, CircleCheck, Pause, Play, SkipBack, SkipForward, Wifi, WifiOff } from "lucide-react";
import { format, parseISO } from "date-fns";
import { t } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { friendlyDay } from "@/lib/dates";
import { useIdea, useOnline } from "@/lib/hooks";
import { removeAttachment, saveTranscript, updateIdea } from "@/lib/repo";
import type { Attachment, Idea, Transcript } from "@/lib/types";
import { useAttachmentUrl } from "@/components/cards";
import { EditorFrame } from "@/components/editor-frame";
import { ConfirmDialog, cx } from "@/components/ui";

const PEAKS = 64;
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Record_Voice_Detail — playback, on-demand transcription, editable transcript (VOICE-01). */
export default function VoiceDetailPage() {
  const { id, attId } = useParams<{ id: string; attId: string }>();
  const idea = useIdea(id);
  const att = useLiveQuery(async () => (await getDb().attachments.get(attId)) ?? null, [attId]);
  const transcript = useLiveQuery(async () => (await getDb().transcripts.where("attachment_id").equals(attId).first()) ?? null, [attId]);
  if (!idea || !att || att.deleted_at || transcript === undefined) return null;
  return <VoiceDetail key={att.id} idea={idea} att={att} transcript={transcript} />;
}

function usePeaks(url: string | null) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    (async () => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        const ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf);
        void ctx.close();
        const data = audio.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / PEAKS));
        const out = Array.from({ length: PEAKS }, (_, i) => {
          let m = 0;
          for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) m = Math.max(m, Math.abs(data[j]));
          return m;
        });
        const max = Math.max(...out, 0.01);
        if (alive) setPeaks(out.map((v) => Math.max(0.08, v / max)));
      } catch {
        if (alive) setPeaks(Array.from({ length: PEAKS }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i * 0.7))));
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);
  return peaks;
}

function VoiceDetail({ idea, att, transcript }: { idea: Idea; att: Attachment; transcript: Transcript | null }) {
  const router = useRouter();
  const online = useOnline();
  const url = useAttachmentUrl(att);
  const peaks = usePeaks(url);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState((att.duration_ms ?? 0) / 1000);
  const [title, setTitle] = useState(idea.title ?? "");
  const [text, setText] = useState(transcript?.text ?? "");
  const [savedText, setSavedText] = useState(transcript?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const back = () => router.replace(`/ideas/${idea.id}`);

  // Transcript edits auto-save locally; the original audio is never modified.
  useEffect(() => {
    if (text === savedText || (!text && !transcript)) return;
    const h = setTimeout(() => {
      void saveTranscript(att.id, text).then(() => setSavedText(text));
    }, 600);
    return () => clearTimeout(h);
  }, [text, savedText, att.id, transcript]);

  async function transcribe() {
    setConsent(false);
    setFailed(null);
    if (!navigator.onLine) return setFailed(t("voice.offline"));
    setBusy(true);
    try {
      const file = await getDb().files.get(att.id);
      if (!file) throw new Error("missing");
      const fd = new FormData();
      fd.append("audio", file.blob, att.file_name ?? "audio.webm");
      fd.append("idempotency_key", att.id);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (res.status === 501) throw new Error("not_configured");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { text: string; language?: string };
      await saveTranscript(att.id, data.text, data.language ?? null);
      setText(data.text);
      setSavedText(data.text);
    } catch (e) {
      setFailed(e instanceof Error && e.message === "not_configured" ? t("voice.not_configured") : t("voice.retry_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    if (title !== (idea.title ?? "")) await updateIdea(idea.id, { title });
    if (text !== savedText) await saveTranscript(att.id, text);
    setSaving(false);
    back();
  }

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };
  const seek = (s: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = Math.min(Math.max(0, a.currentTime + s), a.duration || dur);
  };
  const progress = dur ? pos / dur : 0;
  const recorded = parseISO(att.created_at);

  return (
    <EditorFrame
      title={t("voice.title")}
      closeIcon="back"
      onClose={back}
      primary={t("edit.save")}
      onPrimary={saveChanges}
      saving={saving}
      secondary={
        <button onClick={() => setConfirmDelete(true)} className="hidden min-h-11 text-[10px] font-black tracking-widest text-muted uppercase hover:text-danger lg:inline">
          {t("record.delete")}
        </button>
      }
      footer={
        <button onClick={() => setConfirmDelete(true)} className="w-full pb-5 text-[11px] font-black tracking-[0.2em] text-muted uppercase hover:text-danger lg:hidden">
          {t("record.delete")}
        </button>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 pt-8 pb-16 lg:grid-cols-[1fr_1.4fr] lg:px-12 lg:pt-4">
        <section className="rounded-5xl border border-line bg-surface p-8 text-center shadow-sm lg:self-start lg:rounded-4xl lg:text-left">
          <p className="eyebrow text-ink">{t("voice.recorded")}</p>
          <label htmlFor="v-title" className="sr-only">
            {t("edit.idea_title")}
          </label>
          <input
            id="v-title"
            value={title}
            placeholder={t("idea.voice_note")}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-3 w-full bg-transparent text-center text-2xl font-black tracking-tight placeholder:text-muted/40 focus:outline-none lg:text-left lg:text-xl"
          />
          <p className="mt-2 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
            {friendlyDay(format(recorded, "yyyy-MM-dd"))} • {format(recorded, "MMM d, yyyy")}
          </p>

          <button
            onClick={(e) => {
              const a = audioRef.current;
              if (!a || !dur) return;
              const r = e.currentTarget.getBoundingClientRect();
              a.currentTime = ((e.clientX - r.left) / r.width) * dur;
            }}
            aria-label={t("detail.play")}
            className="relative mt-8 flex h-24 w-full items-center gap-[2px] overflow-hidden rounded-3xl bg-canvas px-3"
          >
            <span className="absolute inset-y-0 left-0 bg-sage/60" style={{ width: `${progress * 100}%` }} aria-hidden />
            {(peaks ?? Array(PEAKS).fill(0.15)).map((p, i) => (
              <span key={i} className={cx("relative flex-1 rounded-full", i / PEAKS <= progress ? "bg-primary" : "bg-primary/30")} style={{ height: `${p * 70}%` }} aria-hidden />
            ))}
          </button>
          <div className="mt-3 flex justify-between text-[10px] font-black tabular-nums">
            <span>{mmss(pos)}</span>
            <span className="text-muted">{mmss(dur)}</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-8">
            <button onClick={() => seek(-10)} aria-label={t("voice.back10")} title={t("voice.back10")} className="flex size-11 items-center justify-center text-muted hover:text-ink">
              <SkipBack className="size-5" fill="currentColor" />
            </button>
            <button
              onClick={toggle}
              disabled={!url}
              aria-label={playing ? t("record.pause") : t("detail.play")}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-8 shadow-primary/20 ring-primary/5 transition-transform active:scale-95 disabled:opacity-50"
            >
              {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6" fill="currentColor" />}
            </button>
            <button onClick={() => seek(10)} aria-label={t("voice.fwd10")} title={t("voice.fwd10")} className="flex size-11 items-center justify-center text-muted hover:text-ink">
              <SkipForward className="size-5" fill="currentColor" />
            </button>
          </div>
          {url && (
            <audio
              ref={audioRef}
              src={url}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
            />
          )}

          {!transcript?.text && (
            <div className="mt-8 rounded-3xl bg-canvas/60 p-4 lg:mt-6">
              <p className={cx("mb-3 flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase", online ? "text-primary" : "text-warning")}>
                {online ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />} {online ? t("voice.need_internet") : t("voice.offline")}
              </p>
              <button
                onClick={() => setConsent(true)}
                disabled={!online || busy}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[11px] font-black tracking-[0.2em] text-primary uppercase shadow-sm hover:border-primary/30 disabled:text-primary/50"
              >
                {busy && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
                {busy ? t("voice.state.transcribing") : t("voice.transcribe")}
              </button>
            </div>
          )}
          {failed && (
            <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-danger-tint px-4 py-3 text-left text-xs font-bold text-danger">
              {failed}
              {online && failed === t("voice.retry_failed") && (
                <button onClick={() => setConsent(true)} className="shrink-0 font-black tracking-widest uppercase underline">
                  {t("action.retry")}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-5xl border border-line bg-surface p-8 shadow-sm lg:rounded-4xl lg:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-[11px] font-black tracking-widest uppercase">
              <AlignLeft className="size-4 text-primary" aria-hidden /> {t("voice.transcript")}
            </h2>
            <p className="flex items-center gap-2 text-[9px] font-black tracking-widest text-muted/50 uppercase">
              {t("voice.autosave")} <CircleCheck className="size-3" aria-hidden />
            </p>
          </div>
          <label htmlFor="v-transcript" className="sr-only">
            {t("voice.action.edit")}
          </label>
          <textarea
            id="v-transcript"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("voice.transcript.placeholder")}
            className="field-sizing-content min-h-60 w-full resize-none bg-transparent text-lg leading-relaxed text-muted placeholder:text-muted/40 focus:outline-none lg:text-[15px]"
          />
        </section>
      </div>

      <ConfirmDialog open={consent} title={t("voice.transcribe")} body={t("voice.consent")} confirmLabel={t("voice.transcribe")} onClose={() => setConsent(false)} onConfirm={() => void transcribe()} />
      <ConfirmDialog
        open={confirmDelete}
        title={t("voice.delete.title")}
        body={t("voice.delete.body")}
        confirmLabel={t("action.delete")}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await removeAttachment(att.id);
          back();
        }}
      />
    </EditorFrame>
  );
}
