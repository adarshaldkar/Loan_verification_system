"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiMic, FiSquare, FiPlay, FiTrash2, FiUploadCloud, FiCheckCircle, FiLoader } from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadVoiceApi } from "@/lib/api";

export interface VoiceRecorderProps {
  /** Form section label, e.g. "Address & Meeting Confirmation" */
  section?: string;
  /** If provided, voice note is uploaded immediately on stop */
  caseId?: string;
  /** Callback after upload/local-blob ready. Returns remote URL or local blob URL */
  onRecordingReady?: (url: string, section?: string) => void;
  className?: string;
}

type RecorderState = "idle" | "recording" | "recorded" | "uploading" | "done";

export default function VoiceRecorder({ section, caseId, onRecordingReady, className }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250);
      setState("recording");
      startTimer();
    } catch {
      toast.error("Microphone access denied. Please allow mic permission.");
    }
  };

  const handleStopRecording = () => {
    stopTimer();
    mediaRecorderRef.current?.stop();
  };

  const handleDiscard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setElapsed(0);
    setState("idle");
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    // If no caseId, just return the local blob URL
    if (!caseId) {
      onRecordingReady?.(audioUrl!, section);
      setState("done");
      toast.success("Voice note ready (will upload on form submit)");
      return;
    }

    setState("uploading");
    try {
      const ext = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("ogg") ? "ogg" : "mp3";
      const fd = new FormData();
      fd.append("audio", audioBlob, `voice_${Date.now()}.${ext}`);
      if (section) fd.append("section", section);

      const res = await uploadVoiceApi(caseId, fd);
      if (res.data?.success) {
        const remoteUrl = res.data.data.url;
        setAudioUrl(remoteUrl);
        onRecordingReady?.(remoteUrl, section);
        setState("done");
        toast.success("Voice recording saved!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload voice recording");
      setState("recorded");
    }
  };

  return (
    <div className={cn("rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2.5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FiMic className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
          {section ? `Voice Note — ${section}` : "Overall Voice Recording"}
        </span>
        {state === "recording" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-red-500 font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            {formatTime(elapsed)}
          </span>
        )}
        {state === "done" && (
          <FiCheckCircle className="ml-auto w-3.5 h-3.5 text-emerald-500" />
        )}
      </div>

      {/* Controls */}
      {state === "idle" && (
        <button
          type="button"
          onClick={handleStartRecording}
          className="w-full flex items-center justify-center gap-2 h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <FiMic className="w-3.5 h-3.5" />
          Start Recording
        </button>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={handleStopRecording}
          className="w-full flex items-center justify-center gap-2 h-9 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition animate-pulse"
        >
          <FiSquare className="w-3.5 h-3.5" />
          Stop Recording ({formatTime(elapsed)})
        </button>
      )}

      {(state === "recorded" || state === "done") && audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full h-8 rounded-lg" style={{ accentColor: "#7c3aed" }} />
          {state === "recorded" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpload}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition"
              >
                <FiUploadCloud className="w-3 h-3" />
                {caseId ? "Upload & Save" : "Use This Recording"}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center justify-center gap-1.5 h-8 w-9 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {state === "done" && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Recording saved</span>
              <button type="button" onClick={handleDiscard} className="text-[10px] text-slate-400 hover:text-red-500 underline">
                Re-record
              </button>
            </div>
          )}
        </div>
      )}

      {state === "uploading" && (
        <div className="flex items-center justify-center gap-2 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-500">
          <FiLoader className="w-3.5 h-3.5 animate-spin" />
          Uploading voice note...
        </div>
      )}
    </div>
  );
}
