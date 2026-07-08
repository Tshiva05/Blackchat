"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceAction, CustomVoiceCommand } from "@/types";
import { buildPhraseMap, matchCommand } from "@/lib/voiceCommands";

type Handlers = Partial<Record<VoiceAction, (argument: string) => void>>;

export function useVoiceCommands(customCommands: CustomVoiceCommand[], handlers: Handlers) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lastHeard, setLastHeard] = useState("");
  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const phraseMap = buildPhraseMap(customCommands);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, []);

  const handleTranscript = useCallback(
    (transcript: string) => {
      setLastHeard(transcript);
      const parsed = matchCommand(transcript, phraseMap);
      if (parsed && handlersRef.current[parsed.action]) {
        handlersRef.current[parsed.action]!(parsed.argument);
      }
    },
    [phraseMap]
  );

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last?.[0]?.transcript) handleTranscript(last[0].transcript);
    };
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setListening(false);
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current?.__shouldRun) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      }
    };

    recognition.__shouldRun = true;
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      /* ignore */
    }
  }, [handleTranscript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.__shouldRun = false;
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listening, supported, lastHeard, toggle, speak };
}
