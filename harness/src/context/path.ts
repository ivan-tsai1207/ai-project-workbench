const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;
const URL_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const GLOB_META = /[*?\[\]{}]/;

export function normalizeRepositoryPath(value: string): string | undefined {
  const candidate = value.trim().normalize("NFC");
  if (
    candidate.length === 0
    || candidate.includes("\\")
    || candidate.includes("\0")
    || candidate.startsWith("/")
    || WINDOWS_ABSOLUTE_PATH.test(candidate)
    || URL_SCHEME.test(candidate)
    || candidate.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return undefined;
  }
  return candidate;
}

export function isCanonicalPathInsideRoot(root: string, canonicalPath: string): boolean {
  if (!root.startsWith("/") || !canonicalPath.startsWith("/")) {
    return false;
  }
  const normalizeAbsolute = (value: string): string | undefined => {
    const segments: string[] = [];
    for (const segment of value.normalize("NFC").split("/")) {
      if (segment.length === 0 || segment === ".") {
        continue;
      }
      if (segment === "..") {
        if (segments.length === 0) {
          return undefined;
        }
        segments.pop();
      } else {
        segments.push(segment);
      }
    }
    return `/${segments.join("/")}`;
  };
  const normalizedRoot = normalizeAbsolute(root);
  const normalizedPath = normalizeAbsolute(canonicalPath);
  return normalizedRoot !== undefined
    && normalizedPath !== undefined
    && (normalizedRoot === "/" || normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`));
}

function matchSegments(
  pattern: readonly string[],
  path: readonly string[],
  patternIndex = 0,
  pathIndex = 0,
  seen: Set<string> = new Set<string>(),
): boolean {
  const state = `${patternIndex}:${pathIndex}`;
  if (seen.has(state)) {
    return false;
  }
  seen.add(state);
  const part = pattern[patternIndex];
  if (part === undefined) {
    return pathIndex === path.length;
  }
  if (part === "**") {
    return matchSegments(pattern, path, patternIndex + 1, pathIndex, seen)
      || (pathIndex < path.length && matchSegments(pattern, path, patternIndex, pathIndex + 1, seen));
  }
  if (pathIndex >= path.length) {
    return false;
  }
  return (part === "*" || part === path[pathIndex])
    && matchSegments(pattern, path, patternIndex + 1, pathIndex + 1, seen);
}

export function matchesScope(path: string, patterns: readonly string[]): boolean {
  const pathSegments = path.split("/");
  return patterns.some((pattern) => {
    const normalized = normalizeRepositoryPath(pattern);
    if (normalized === undefined) {
      return false;
    }
    const segments = normalized.split("/");
    if (segments.some((segment) => segment !== "*" && segment !== "**" && GLOB_META.test(segment))) {
      return false;
    }
    return matchSegments(segments, pathSegments);
  });
}

export function isSensitiveContextPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return normalized.split("/").some((segment) =>
    segment === ".env"
    || segment.startsWith(".env.")
    || segment === ".ssh"
    || segment === ".npmrc"
    || segment === ".netrc"
    || segment === ".git-credentials"
    || segment === "id_rsa"
    || segment === "id_ed25519"
    || segment.endsWith(".key")
    || segment.endsWith(".pem")
    || /^(?:credential|credentials|secret|secrets)(?:\.|$)/.test(segment));
}
