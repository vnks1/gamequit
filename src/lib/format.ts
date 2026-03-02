export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

export function formatRelativeTime(createdUtc: number, nowUtc = Date.now() / 1000) {
  const diffSeconds = Math.max(0, Math.floor(nowUtc - createdUtc));
  if (diffSeconds < 60) return "há poucos segundos";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `há ${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `há ${diffWeeks} sem`;
}
