"use client";

/**
 * Sample fixtures — PRD §15.4 note 2: demo content is only shown when the user explicitly loads it,
 * and every demo record is flagged and badged "Demo" in the UI.
 */
import { ymd } from "./dates";
import { addPlatformPlan, createCategory, createIdea, createTask, saveTranscript, uid, updatePlatformPlan } from "./repo";
import { getDb } from "./db";

async function svgBlob(bg: string, fg: string): Promise<Blob> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><circle cx="270" cy="140" r="70" fill="${fg}" opacity=".55"/><rect x="60" y="230" width="280" height="110" rx="18" fill="${fg}" opacity=".35"/></svg>`;
  const img = new Image();
  img.src = "data:image/svg+xml;base64," + btoa(svg);
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 400;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}

export async function loadDemoData() {
  const concept = await createCategory("Concept (demo)", true).catch(() => null);
  const visual = await createCategory("Visual (demo)", true).catch(() => null);

  const now = new Date();
  const today = ymd(now);
  const tomorrow = ymd(new Date(now.getTime() + 86400_000));
  const inTwoHours = new Date(now.getTime() + 2 * 3600_000);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const workspace = await createIdea({
    clientId: uid(),
    title: "Sustainable Workspace Aesthetic",
    body: "Natural light, plant integration, minimalist desk setup. Film a slow pan at golden hour and a before/after of the desk.",
    category_id: concept?.id ?? null,
    attachments: [{ kind: "image", blob: await svgBlob("#DCE9DF", "#176B66"), file_name: "workspace.png" }],
    demo: true,
  });
  const tiktok = await addPlatformPlan(workspace.id, "tiktok");
  await updatePlatformPlan(tiktok.id, {
    publish_state: "in_progress",
    caption: "Bringing nature into the workspace. #minimalism #office #creative",
    notes: "Capture the transition from the camera lens to the room. Natural lighting is key.",
    target_at: new Date(now.getTime() + 9 * 86400_000).toISOString(),
  });
  await addPlatformPlan(workspace.id, "instagram");
  await createTask({ title: "Record transition shots", idea_id: workspace.id, platform_plan_id: tiktok.id, demo: true });

  const podcast = await createIdea({
    clientId: uid(),
    title: "Podcast Hook Ideas",
    attachments: [{ kind: "audio", blob: new Blob([new Uint8Array(64)], { type: "audio/webm" }), file_name: "voice-note.webm", duration_ms: 42000 }],
    demo: true,
  });
  const audio = await getDb().attachments.where("idea_id").equals(podcast.id).first();
  if (audio) await saveTranscript(audio.id, "Starting with a question about creativity: what would you make if nobody was watching?");

  await createIdea({
    clientId: uid(),
    title: "Texture study: Brutalism",
    body: "Photo reference from the new museum exhibit. Concrete, shadows, repeating grids.",
    category_id: visual?.id ?? null,
    attachments: [{ kind: "image", blob: await svgBlob("#F3B9A6", "#242A32"), file_name: "brutalism.png" }],
    demo: true,
  });

  await createIdea({
    clientId: uid(),
    body: "Carousel: 5 desk upgrades under $50",
    attachments: [{ kind: "url", url: "https://example.com/desk-upgrades" }],
    demo: true,
  });

  await createTask({ title: "Draft script for 'Minimalist Living' reel", idea_id: workspace.id, due_date: today, demo: true });
  await createTask({ title: "Review audio transcription", idea_id: podcast.id, due_date: today, demo: true });
  await createTask({
    title: "Post to Instagram",
    idea_id: workspace.id,
    due_date: ymd(inTwoHours),
    due_time: hhmm(inTwoHours),
    reminder: { mode: "before", offset_minutes: 60 },
    demo: true,
  });
  await createTask({ title: "Export finished photos", due_date: ymd(new Date(now.getTime() - 86400_000)), demo: true });
  await createTask({ title: "Research new camera lens", notes: "Compare two prime lenses for low light.", demo: true });
  await createTask({ title: "Backup SD Card", due_date: tomorrow, due_time: "17:00", reminder: { mode: "at_due" }, demo: true });
}
