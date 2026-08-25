/**
 * Quill stores article bodies as HTML. Keep the public rendering limited to
 * the elements the editor produces, and remove unsafe link protocols.
 */
export function sanitizeBlogHtml(value: string) {
  const allowedTags = new Set([
    "a",
    "blockquote",
    "br",
    "em",
    "h1",
    "h2",
    "h3",
    "li",
    "ol",
    "p",
    "s",
    "strong",
    "u",
    "ul",
  ]);

  return value.replace(/<\/?([a-zA-Z0-9-]+)(?:\s[^<>]*)?>/g, (tag, name) => {
    const normalizedName = name.toLowerCase();
    if (!allowedTags.has(normalizedName)) return "";
    if (tag.startsWith("</")) return `</${normalizedName}>`;

    if (normalizedName !== "a") return `<${normalizedName}>`;

    const href = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    const isSafeHref = href && /^(https?:|mailto:|tel:|\/|#)/i.test(href);
    return isSafeHref
      ? `<a href="${href.replace(/"/g, "&quot;")}" rel="noreferrer noopener">`
      : "<a>";
  });
}
