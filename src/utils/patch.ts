export function applyUnifiedPatch(original: string, patch: string): string {
  if (!patch.trim()) return original;
  const origLines = original.split("\n");
  const patchLines = patch.split("\n");
  const result: string[] = [];
  let origIdx = 0;
  let pi = 0;

  // Skip file header lines (--- +++)
  while (pi < patchLines.length && !patchLines[pi].startsWith("@@")) pi++;

  while (pi < patchLines.length) {
    const hunkMatch = patchLines[pi].match(/^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/);
    if (!hunkMatch) { pi++; continue; }
    const oldStart = parseInt(hunkMatch[1]) - 1; // convert to 0-based
    pi++;

    while (origIdx < oldStart && origIdx < origLines.length) result.push(origLines[origIdx++]);

    while (pi < patchLines.length && !patchLines[pi].startsWith("@@")) {
      const l = patchLines[pi];
      if (l.startsWith("+")) result.push(l.slice(1));
      else if (l.startsWith("-")) origIdx++;
      else result.push(origLines[origIdx++]);
      pi++;
    }
  }

  while (origIdx < origLines.length) result.push(origLines[origIdx++]);
  return result.join("\n");
}
