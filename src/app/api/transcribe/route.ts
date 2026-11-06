/**
 * On-demand transcription endpoint (VOICE-01). Only called after the user taps Transcribe
 * and accepts the consent notice. Provider keys stay server-side.
 *
 * Provider is OPEN in the PRD; this uses an OpenAI-compatible /audio/transcriptions API when
 * TRANSCRIPTION_API_KEY is set, and returns 501 otherwise so the UI shows a clear message.
 */
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  const key = process.env.TRANSCRIPTION_API_KEY;
  if (!key) return Response.json({ error: "not_configured" }, { status: 501 });

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) return Response.json({ error: "missing_audio" }, { status: 422 });
  if (audio.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  if (audio.type && !audio.type.startsWith("audio/") && audio.type !== "video/webm") {
    return Response.json({ error: "unsupported" }, { status: 415 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, "audio.webm");
  upstream.append("model", process.env.TRANSCRIPTION_MODEL ?? "whisper-1");

  const res = await fetch(`${process.env.TRANSCRIPTION_BASE_URL ?? "https://api.openai.com/v1"}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: upstream,
  });
  if (res.status === 429) return Response.json({ error: "quota" }, { status: 429 });
  if (!res.ok) return Response.json({ error: "provider_error" }, { status: 502 });
  const data = (await res.json()) as { text: string; language?: string };
  return Response.json({ text: data.text, language: data.language ?? null });
}
