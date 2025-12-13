import { Blueprint } from "./types";

const trimEmptyEdges = (lines: string[]) => {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]?.trim() === "") start += 1;
  while (end > start && lines[end - 1]?.trim() === "") end -= 1;
  return lines.slice(start, end);
};

export const rowsFromText = (text: string): string[] => {
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const lines = normalized.split("\n");
  const trimmed = trimEmptyEdges(lines);

  // If the block is indented, de-indent by the smallest common left padding.
  const nonEmpty = trimmed.filter((l) => l.trim() !== "");
  const minIndent =
    nonEmpty.length === 0
      ? 0
      : Math.min(
          ...nonEmpty.map((l) => {
            const m = l.match(/^\s+/);
            return m ? m[0].length : 0;
          })
        );

  return trimmed.map((l) => (minIndent > 0 ? l.slice(minIndent) : l));
};

export const blueprintFromText = (text: string): Blueprint => ({
  rows: rowsFromText(text),
});

