import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_7 Task 2: the way out.
describe('the way out', () => {
  it('"Not what I wrote" toggles until submit, with no dialog', () => {
    const btn = at('app', 'study', 'session', '[id]', 'reject-line-button.tsx');
    expect(btn).toMatch(/rejected \? await restoreLine/);
    expect(btn).toMatch(/\{rejected \? 'That is mine' : 'Not what I wrote'\}/);
    expect(btn).not.toMatch(/confirm\(|<dialog/);
    const action = at('app', 'study', 'session', '[id]', 'reject-line.ts');
    expect(action).toMatch(/export async function restoreLine/);
    expect(action).toMatch(/LineRejected\.deleteOne\(\{ transcription_id: transcriptionId, line_index: lineIndex \}\)/);
    expect(action.split('marker_version) return').length).toBe(3);
  });
  it('keeps the photograph, collapsible, while the page is open', () => {
    const photo = at('app', 'study', 'session', '[id]', 'working-photo.tsx');
    expect(photo).toMatch(/<details className="mt-2">[\s\S]*Your photograph[\s\S]*<img src=\{thumb\}/);
  });
  it('after the last take, says where to go, with the one help address', () => {
    const photo = at('app', 'study', 'session', '[id]', 'working-photo.tsx');
    expect(photo).toMatch(/No retakes left for this question\. Check the answer boxes below\. If we misread your working, tell us: \$\{LANDING\.contactEmail\}/);
  });
  it('the chrome carries the sitting, Help and a 44px Sign out', () => {
    const chrome = at('app', 'study', 'study-chrome.tsx');
    expect(chrome).toMatch(/\{sitting\}[\s\S]*LANDING\.contactEmail[\s\S]*<button className="min-h-11[^"]*">Sign out<\/button>/);
  });
});
