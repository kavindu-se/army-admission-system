export function formatNameWithInitials(name) {
  if (!name) return "";
  const trimmed = String(name).replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (trimmed.includes(".")) return trimmed;
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length <= 1) return trimmed;
  const first = parts[0];
  if (/^[A-Z]{2,6}$/.test(first) && !/^[A-Z]{2,}$/.test(parts[1] || "")) {
    return trimmed;
  }
  if (parts.length === 2) {
    const lastToken = parts[1];
    if (/^[A-Z]{2,5}$/.test(lastToken) && /^[A-Z]{3,}$/.test(first)) {
      const initials = lastToken.split("").join(". ");
      return `${initials}. ${first}`;
    }
  }
  const last = parts.pop();
  const initials = parts
    .map((part) => part.charAt(0).toUpperCase())
    .filter(Boolean)
    .join(". ");
  if (!initials) return trimmed;
  return `${initials}. ${last}`;
}
