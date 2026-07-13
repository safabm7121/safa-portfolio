"use client";

import { Suspense, use, useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useAnimationControls } from "motion/react";
import { usePasscodeAccess, grantPasscodeAccess } from "@/components/providers/PasscodeAccessProvider";

const SLOT_COUNT = 4;

/** Decode the route scope: "_" means root ("/"); otherwise ensure a leading "/". */
function decodeScope(raw: string): string {
  const decoded = decodeURIComponent(raw);
  if (decoded === "_" || decoded === "") return "/";
  return decoded.startsWith("/") ? decoded : `/${decoded}`;
}

/** Reject off-site / protocol-relative returns; default to "/". */
function sanitizeReturnTo(value: string | null): string {
  if (!value) return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  return trimmed;
}

type SubmitState = "idle" | "success";

export default function UnlockPage({
  params,
}: {
  params: Promise<{ scope: string }>;
}) {
  const { scope: rawScope } = use(params);
  const scope = decodeScope(rawScope);

  // useSearchParams requires a Suspense boundary in Next 16.
  return (
    <Suspense
      fallback={<div className="fixed inset-0 flex justify-center items-center bg-b1" />}
    >
      <UnlockScreen scope={scope} />
    </Suspense>
  );
}

function UnlockScreen({ scope }: { scope: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("return"));
  const { refresh } = usePasscodeAccess();

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  const [code, setCode] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  // Keep focus on the hidden input.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (value: string) => {
    // Client-side validation for the static build (no /api route). The original
    // gate code "2026" reveals the protected "/2026" content.
    if (value === "2026") {
      grantPasscodeAccess(scope);
      return true;
    }
    return false;
  };

  const onChange = async (raw: string) => {
    if (state === "success") return;
    const next = raw.slice(0, SLOT_COUNT);
    setCode(next);
    if (next.length !== SLOT_COUNT) return;

    const ok = await submit(next);
    if (!ok) {
      await shake.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.5, ease: "easeInOut" },
      });
      setCode("");
      inputRef.current?.focus();
      return;
    }

    await refresh();
    setState("success");
    window.setTimeout(() => {
      router.replace(returnTo);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 flex justify-center items-center bg-b1"
      onClick={() => inputRef.current?.focus()}
    >
      <label className="sr-only" htmlFor={inputId}>
        Passcode for {scope}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={SLOT_COUNT}
        inputMode="numeric"
        value={code}
        onChange={(e) => void onChange(e.target.value)}
        className="absolute opacity-0 w-px h-px"
      />

      <div className="relative flex flex-col items-center gap-6" aria-hidden="true">
        <span
          className={`font-mono text-sm tracking-wide ${
            state === "success" ? "text-l1" : "text-l3"
          }`}
        >
          {state === "success" ? "Access granted" : "Please enter passcode"}
        </span>

        <motion.div className="flex gap-3" animate={shake}>
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const filled = i < code.length;
            const current = i === code.length;
            return (
              <div
                key={i}
                className="flex justify-center items-center rounded-full w-12 h-12 font-mono tabular-nums text-l1 text-lg transition-shadow duration-300 ease-66"
                style={{
                  boxShadow: `inset 0 0 0 4px ${
                    filled || current ? "var(--label-1)" : "var(--label-3)"
                  }`,
                }}
              >
                {filled ? (
                  code[i]
                ) : current ? (
                  <motion.span
                    className="block bg-l1 w-px h-5"
                    aria-hidden="true"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{
                      duration: 1.06,
                      times: [0, 0.5, 0.5, 1],
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
