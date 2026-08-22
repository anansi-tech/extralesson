'use client';

import { useRef, useState, useTransition } from 'react';
import { captureWorking } from './capture';
import { MAX_TAKES, type TranscriptionResult } from '@/lib/grade/transcribe';

/**
 * PHOTOGRAPH THE WORKING, AND SEE WHAT WE READ.
 *
 * R2 §2 and §3. The camera opens straight onto the page on a phone; on a
 * desktop the same control takes a file. It appears only after the typed
 * answers have been submitted, because those are the deterministic record and
 * the reveal must not influence what gets photographed.
 *
 * The photo is scaled down HERE, on the device, before it is sent. A modern
 * phone camera produces four megabytes of a page that needs a few hundred
 * kilobytes to read, and the difference is a student's data allowance.
 *
 * Nothing here marks anything. What comes back is what we read, shown per part,
 * so a student can see exactly what the marker will be working from.
 */
const LONG_EDGE = 1400;
const QUALITY = 0.75;

async function scaleDown(file: File): Promise<{ data: string; contentType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL('image/jpeg', QUALITY);
  return { data: url.slice(url.indexOf(',') + 1), contentType: 'image/jpeg' };
}

export function WorkingPhoto({ attemptId, marks }: { attemptId: string; marks: number }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [read, setRead] = useState<TranscriptionResult | null>(null);
  const [takesLeft, setTakesLeft] = useState(MAX_TAKES);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (file: File) => {
    setError(null);
    start(async () => {
      try {
        const { data, contentType } = await scaleDown(file);
        const res = await captureWorking({ attemptId, contentType, data });
        if ('error' in res) setError(res.error);
        else {
          setRead(res.transcription);
          setTakesLeft(res.takesLeft);
        }
      } catch {
        setError('That photo could not be prepared on this device.');
      }
    });
  };

  // Grouped by the part each line belongs to, with an unlabelled line
  // inheriting the part above it — the same rule the marker applies, so what a
  // student is shown is what will be marked.
  const byPart: { part: string; lines: { text: string; confidence: number }[] }[] = [];
  let current: string | null = null;
  for (const line of read?.lines ?? []) {
    if (line.part_label) current = line.part_label;
    const key = current ?? '—';
    const last = byPart[byPart.length - 1];
    if (last && last.part === key) last.lines.push(line);
    else byPart.push({ part: key, lines: [line] });
  }

  return (
    <div className="mt-4 border-t-[1.5px] border-rule pt-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
        Your working on paper
      </div>

      {!read && (
        <p className="mt-1 text-[12px] leading-snug text-dim">
          There {marks === 1 ? 'is 1 mark' : `are ${marks} marks`} here for the method, and we
          cannot see your working. Photograph what you wrote and we will type it up beside the
          mark scheme. Nothing you have already earned can change.
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) send(file);
          e.target.value = '';
        }}
      />

      {takesLeft > 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="mt-2 min-h-11 w-full border-[1.5px] border-ink p-3 font-mono text-xs uppercase tracking-widest disabled:opacity-60"
        >
          {pending ? 'Reading…' : read ? 'Take it again' : 'Photograph your working'}
        </button>
      )}

      {error && (
        <p className="mt-2 border-l-3 border-red-pen bg-[#FDF1F0] p-2 text-[12px] leading-snug">
          {error}
        </p>
      )}

      {read && (
        <div className="mt-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
            This is what we read
          </div>
          {!read.legible && (
            <p className="mt-1 text-[12px] leading-snug text-dim">
              We could not read this photograph. Nothing has changed — try again in better light,
              or leave it.
            </p>
          )}
          {byPart.map((group) => (
            <div key={group.part} className="mt-2">
              <div className="font-mono text-[11px] text-dim">
                {group.part === '—' ? 'Not matched to a part' : `(${group.part})`}
              </div>
              <ul className="mt-0.5 border-l-3 border-paper-deep pl-3">
                {group.lines.map((line, i) => (
                  <li key={i} className="font-mono text-[13px] leading-snug">
                    {line.text}
                    {line.confidence < 0.6 && (
                      <span className="ml-2 font-mono text-[10px] text-dim">hard to read</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {read.notes && (
            <p className="mt-2 text-[12px] leading-snug text-dim">{read.notes}</p>
          )}
          <p className="mt-2 text-[12px] leading-snug text-dim">
            {takesLeft > 0
              ? 'If that is not what you wrote, take it again once.'
              : 'That is the second photograph, so it stands.'}
          </p>
        </div>
      )}
    </div>
  );
}
