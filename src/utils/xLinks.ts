export function tweetUrl(authorHandle: string | null | undefined, tweetId: string | number) {
  const id = String(tweetId);
  const handle = (authorHandle || '').replace(/^@/, '');
  // Fallback route works even if handle is unknown/blank
  return handle ? `https://x.com/${handle}/status/${id}` : `https://x.com/i/web/status/${id}`;
}

export function tweetSearchUrl(text?: string | null, authorHandle?: string | null) {
  const qParts: string[] = [];
  if (authorHandle) qParts.push(`from:${authorHandle.replace(/^@/, '')}`);
  if (text) qParts.push(`"${text.slice(0, 80)}"`);
  const q = encodeURIComponent(qParts.join(' '));
  return `https://x.com/search?q=${q}&src=typed_query&f=top`;
}
