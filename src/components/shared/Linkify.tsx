import type { ReactNode } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

/** Renders text with URLs auto-linked as clickable <a> tags */
export function Linkify({ children }: { children: string }) {
  if (!children) return null;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(children)) !== null) {
    // Text before the URL
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }
    // The URL itself
    const url = match[1];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="gt-link"
        onClick={e => e.stopPropagation()}
      >
        {url.length > 60 ? url.slice(0, 57) + '...' : url}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return <>{parts}</>;
}
