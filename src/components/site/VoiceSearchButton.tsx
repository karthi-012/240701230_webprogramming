import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transcribeAudio } from "@/lib/ai.functions";

type Props = {
  onTranscript: (text: string) => void;
  className?: string;
};

function isMicrophoneBlockedByPage() {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
  };
  const policy = doc.featurePolicy ?? doc.permissionsPolicy;
  return typeof policy?.allowsFeature === "function" && !policy.allowsFeature("microphone");
}

export function VoiceSearchButton({ onTranscript, className }: Props) {
  const transcribe = useServerFn(transcribeAudio);
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      if (isMicrophoneBlockedByPage()) {
        toast.error("Microphone is blocked in this preview. Open the app in a new tab or publish it, then try again.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size < 1024) {
          toast.error("That recording was too short — try again.");
          setState("idle");
          return;
        }
        setState("processing");
        try {
          const buf = new Uint8Array(await blob.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
          const base64 = btoa(bin);
          const { text } = await transcribe({ data: { audioBase64: base64, mimeType: blob.type } });
          if (text.trim()) {
            onTranscript(text.trim());
            toast.success("Heard you!");
          } else {
            toast.error("Couldn't hear anything — try again.");
          }
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setState("idle");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      toast.error("Microphone access denied. Check the address-bar permission settings and try again.");
    }
  };

  const stop = () => recorderRef.current?.stop();

  return (
    <Button
      type="button"
      variant={state === "recording" ? "destructive" : "outline"}
      size="icon"
      className={className}
      onClick={state === "recording" ? stop : start}
      disabled={state === "processing"}
      title={state === "recording" ? "Stop recording" : "Voice search (Tamil / English)"}
    >
      {state === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> :
       state === "recording" ? <Square className="h-4 w-4" /> :
       <Mic className="h-4 w-4" />}
    </Button>
  );
}
