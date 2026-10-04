import { fromMarkdown } from "mdast-util-from-markdown";

interface AstPosition {
  readonly start?: { readonly offset?: number };
  readonly end?: { readonly offset?: number };
}

interface AstNode {
  readonly type: string;
  readonly value?: unknown;
  readonly depth?: unknown;
  readonly children?: readonly AstNode[];
  readonly position?: AstPosition;
}

export interface SectionExtractionResult {
  readonly content: string;
  readonly fallback_reason?: string;
}

function textOf(node: AstNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }
  return (node.children ?? []).map(textOf).join("");
}

function slug(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sectionNumber(value: string): string | undefined {
  return /^(\d+(?:\.\d+)*)\b/.exec(value.trim())?.[1];
}

function requestedSectionNumber(value: string): string | undefined {
  const match = /^(?:section\s+)?(\d+(?:\.\d+)*)$/i.exec(value.trim());
  return match?.[1];
}

function nodeOffsets(node: AstNode): Readonly<{ start: number; end: number }> | undefined {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  return typeof start === "number" && typeof end === "number" ? { start, end } : undefined;
}

export function extractMarkdownSection(
  markdown: string,
  section: string | undefined,
  anchor: string | undefined,
  allowFullDocumentFallback: boolean,
): SectionExtractionResult | undefined {
  if (section === undefined && anchor === undefined) {
    return Object.freeze({ content: markdown });
  }

  let root: AstNode;
  try {
    root = fromMarkdown(markdown) as unknown as AstNode;
  } catch {
    return allowFullDocumentFallback
      ? Object.freeze({ content: markdown, fallback_reason: "MARKDOWN_AST_PARSE_FAILED" })
      : undefined;
  }

  const children = root.children ?? [];
  const headings = children
    .map((node, index) => ({ node, index, text: textOf(node).trim().normalize("NFC") }))
    .filter(({ node }) => node.type === "heading" && typeof node.depth === "number");
  const requestedNumber = section === undefined ? undefined : requestedSectionNumber(section);
  const requestedText = section?.trim().normalize("NFC");
  const requestedAnchor = anchor?.trim().replace(/^#/, "").normalize("NFC").toLowerCase();
  const target = headings.find(({ text }) => {
    const sectionMatches = section === undefined
      || text === requestedText
      || (requestedNumber !== undefined && sectionNumber(text) === requestedNumber);
    const anchorMatches = anchor === undefined || slug(text) === requestedAnchor;
    return sectionMatches && anchorMatches;
  });

  if (target === undefined) {
    if (!allowFullDocumentFallback) {
      return undefined;
    }
    return Object.freeze({
      content: markdown,
      fallback_reason: section !== undefined && anchor !== undefined
        ? "SECTION_AND_ANCHOR_UNRESOLVED"
        : section !== undefined ? "SECTION_UNRESOLVED" : "ANCHOR_UNRESOLVED",
    });
  }

  const targetDepth = target.node.depth as number;
  const targetStart = nodeOffsets(target.node)?.start;
  const next = headings.find(({ index, node }) => index > target.index && (node.depth as number) <= targetDepth);
  const targetEnd = next === undefined ? markdown.length : nodeOffsets(next.node)?.start;
  if (targetStart === undefined || targetEnd === undefined) {
    return allowFullDocumentFallback
      ? Object.freeze({ content: markdown, fallback_reason: "AST_POSITION_UNAVAILABLE" })
      : undefined;
  }

  const ancestry: string[] = [];
  let maximumDepth = targetDepth;
  for (let index = headings.indexOf(target) - 1; index >= 0; index -= 1) {
    const candidate = headings[index];
    if (candidate === undefined) {
      continue;
    }
    const depth = candidate.node.depth as number;
    if (depth < maximumDepth) {
      const offsets = nodeOffsets(candidate.node);
      if (offsets === undefined) {
        return allowFullDocumentFallback
          ? Object.freeze({ content: markdown, fallback_reason: "AST_POSITION_UNAVAILABLE" })
          : undefined;
      }
      ancestry.unshift(markdown.slice(offsets.start, offsets.end));
      maximumDepth = depth;
    }
  }

  const extracted = [...ancestry, markdown.slice(targetStart, targetEnd).trimEnd()].join("\n\n");
  return Object.freeze({ content: `${extracted}\n` });
}
