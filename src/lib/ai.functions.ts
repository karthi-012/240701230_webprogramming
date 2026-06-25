import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function requireKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured");
  return key;
}

/** Transcribe a recorded audio clip (base64 + mime) into text. */
export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: { audioBase64: string; mimeType: string }) => {
    if (!input?.audioBase64) throw new Error("Missing audio");
    return input;
  })
  .handler(async ({ data }) => {
    const key = requireKey();
    const mime = data.mimeType.split(";")[0];
    const extMap: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp4": "mp4",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
    };
    const ext = extMap[mime] ?? "webm";

    const bin = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bin], { type: mime });

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", blob, `voice.${ext}`);
    form.append("prompt", "The speaker is searching for a local service professional like plumber, electrician, carpenter, mechanic, cook, painter, tutor, cleaner.");

    const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`Transcription failed (${res.status}): ${msg.slice(0, 200)}`);
    }
    const json = (await res.json()) as { text?: string };
    const raw = (json.text ?? "").trim();
    if (!raw) return { text: "" };

    // Translate/normalize to a short English search keyword so it matches DB categories.
    const tr = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Translate the user's spoken query into a short English search phrase (1-4 words) suitable for finding a local service professional. Reply with ONLY the phrase, no punctuation, no quotes." },
          { role: "user", content: raw },
        ],
      }),
    });
    if (!tr.ok) return { text: raw };
    const trJson = (await tr.json()) as { choices?: { message?: { content?: string } }[] };
    const english = trJson.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? raw;
    return { text: english };
  });


/** Generate a short AI summary of a provider from their profile + recent reviews. */
export const summarizeProvider = createServerFn({ method: "POST" })
  .inputValidator((input: {
    name: string;
    category: string;
    headline?: string | null;
    bio?: string | null;
    experienceYears?: number | null;
    avgRating?: number | null;
    totalReviews?: number | null;
    reviewComments?: string[];
  }) => input)
  .handler(async ({ data }) => {
    const key = requireKey();
    const reviewBlock = (data.reviewComments ?? [])
      .filter(Boolean)
      .slice(0, 8)
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n");

    const prompt = `Write a friendly 2-3 sentence summary (max 60 words) helping a customer decide whether to hire this local professional. Be concrete, mention strengths from reviews, avoid hype words like "amazing".

Name: ${data.name}
Trade: ${data.category}
Headline: ${data.headline ?? "—"}
Experience: ${data.experienceYears ?? 0} years
Rating: ${data.avgRating ?? 0} from ${data.totalReviews ?? 0} reviews
Bio: ${data.bio ?? "—"}
Recent reviews:
${reviewBlock || "(no reviews yet)"}`;

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You write concise, honest summaries of service professionals for customers." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`AI summary failed (${res.status}): ${msg.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { summary: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });
