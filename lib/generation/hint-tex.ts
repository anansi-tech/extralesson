/**
 * TeX THROUGH JSON (ROUND_7 Task 1): the hint generator tells the model to
 * double every backslash inside the JSON string, restores any command name
 * the criterion has that arrives bare ("overrightarrow{"), and refuses a hint
 * that quotes TeX without every command its criterion carries.
 */
const TEX_COMMAND = /\\([A-Za-z]+)/g;
export const commandsIn = (s: string): string[] => [...new Set([...s.matchAll(TEX_COMMAND)].map((m) => m[1]))];

export function repairTex(hint: string, criterion: string): string {
  let out = hint;
  for (const c of commandsIn(criterion)) out = out.replace(new RegExp(`(?<!\\\\)\\b${c}(?=[{\\s$])`, 'g'), `\\${c}`);
  return out;
}

export function missingCommands(hint: string, criterion: string): string[] {
  if (!hint.includes('$')) return [];
  const have = new Set(commandsIn(hint));
  return commandsIn(criterion).filter((c) => !have.has(c));
}

