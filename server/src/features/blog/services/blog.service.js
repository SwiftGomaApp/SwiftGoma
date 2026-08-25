const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError, NotFoundError } = require("../../../common/errors");
const { generateSlug } = require("../../product/utils/product.utils");

const prisma = getPrismaClient();

const ALLOWED_RICH_TEXT_TAGS = new Set([
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

function sanitizeRichText(content) {
  return content.replace(/<\/?([a-zA-Z0-9-]+)(?:\s[^<>]*)?>/g, (tag, name) => {
    const tagName = name.toLowerCase();
    if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) return "";
    if (tag.startsWith("</")) return `</${tagName}>`;
    if (tagName !== "a") return `<${tagName}>`;

    const href = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    if (!href || !/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return "<a>";
    return `<a href="${href.replace(/"/g, "&quot;")}" rel="noreferrer noopener">`;
  });
}

async function generateUniqueSlug(title) {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function assertValidContent({ title, excerpt, content }) {
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ValidationError("Veuillez indiquer un titre.");
  }
  if (!excerpt || typeof excerpt !== "string" || !excerpt.trim()) {
    throw new ValidationError("Veuillez indiquer un résumé.");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ValidationError("Veuillez rédiger le contenu de l'article.");
  }
}

async function createPost({
  authorId,
  title,
  excerpt,
  content,
  coverImageUrl,
  status,
}) {
  const safeContent = sanitizeRichText(content || "");
  assertValidContent({ title, excerpt, content: safeContent });

  const resolvedStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const slug = await generateUniqueSlug(title);

  return prisma.blogPost.create({
    data: {
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      content: safeContent.trim(),
      coverImageUrl: coverImageUrl || null,
      status: resolvedStatus,
      publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
      authorId: authorId || null,
    },
  });
}

async function updatePost(
  id,
  { title, excerpt, content, coverImageUrl, status },
) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Article introuvable.");

  const safeContent =
    content === undefined ? undefined : sanitizeRichText(content);

  if (
    title !== undefined ||
    excerpt !== undefined ||
    safeContent !== undefined
  ) {
    assertValidContent({
      title: title ?? existing.title,
      excerpt: excerpt ?? existing.excerpt,
      content: safeContent ?? existing.content,
    });
  }

  const becomingPublished =
    status === "PUBLISHED" && existing.status !== "PUBLISHED";

  return prisma.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(excerpt !== undefined && { excerpt: excerpt.trim() }),
      ...(safeContent !== undefined && { content: safeContent.trim() }),
      ...(coverImageUrl !== undefined && {
        coverImageUrl: coverImageUrl || null,
      }),
      ...(status !== undefined && { status }),
      ...(becomingPublished &&
        !existing.publishedAt && { publishedAt: new Date() }),
    },
  });
}

async function deletePost(id) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Article introuvable.");

  await prisma.blogPost.delete({ where: { id } });
  return { id, deleted: true };
}

async function getPostById(id) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new NotFoundError("Article introuvable.");
  return post;
}

async function getPublishedPostBySlug(slug) {
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") {
    throw new NotFoundError("Article introuvable.");
  }
  return post;
}

function parsePagination({ page = 1, limit = 20 } = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  return { safePage, safeLimit, skip: (safePage - 1) * safeLimit };
}

async function listPublishedPosts(params = {}) {
  const { safePage, safeLimit, skip } = parsePagination(params);
  const where = { status: "PUBLISHED" };

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: safeLimit,
    }),
  ]);

  return {
    posts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function listAllPosts(params = {}) {
  const { safePage, safeLimit, skip } = parsePagination(params);

  const [total, posts] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
  ]);

  return {
    posts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPublishedPostBySlug,
  listPublishedPosts,
  listAllPosts,
};
