const STATUS_VARIANTS = {
  not_start: ["not_start", "not started", "not-start", "notstarted", "pending", "new"],
  in_progress: ["in_progress", "in progress", "in-progress", "inprogress", "processing"],
  completed: ["completed", "complete", "done", "closed", "resolved"],
  rejected: ["rejected", "reject", "declined", "cancelled", "canceled"],
};

const normalizeBasePath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const extractPathnameFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return normalizeBasePath(parsed.pathname || "");
  } catch {
    return "";
  }
};

const uploadBasePath =
  normalizeBasePath(process.env.APP_BASE_PATH) ||
  normalizeBasePath(process.env.PUBLIC_BASE_PATH) ||
  extractPathnameFromUrl(process.env.FRONTEND_URL) ||
  extractPathnameFromUrl(process.env.CLIENT_URL) ||
  "";

const normalizeUploadUrl = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/uploads/")) return trimmed;
  if (!uploadBasePath || uploadBasePath === "/") return trimmed;
  if (trimmed.startsWith(`${uploadBasePath}/`)) return trimmed;

  return `${uploadBasePath}${trimmed}`;
};

const normalizeUserMedia = (user) => {
  if (!user || typeof user !== "object") return user;
  return {
    ...user,
    picture: normalizeUploadUrl(user.picture),
  };
};

const normalizeToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const VARIANT_TO_CANONICAL = Object.entries(STATUS_VARIANTS).reduce((acc, [canonical, variants]) => {
  variants.forEach((variant) => {
    acc[normalizeToken(variant)] = canonical;
  });
  return acc;
}, {});

const getStatusVariants = (canonical) => {
  const variants = STATUS_VARIANTS[canonical] || [canonical];
  return Array.from(new Set(variants.map((value) => String(value ?? "").trim()).filter(Boolean)));
};

const normalizeTicketStatus = (status) => {
  const normalized = normalizeToken(status);
  return VARIANT_TO_CANONICAL[normalized] || "not_start";
};

const getStatusWhere = (status) => {
  const normalized = normalizeToken(status);
  if (!normalized || normalized === "all") return undefined;

  const canonical = VARIANT_TO_CANONICAL[normalized];
  if (!canonical) {
    return { equals: normalized };
  }

  return { in: getStatusVariants(canonical) };
};

const normalizeTicketEntity = (ticket) => {
  if (!ticket || typeof ticket !== "object") return ticket;

  const normalizedImages = Array.isArray(ticket.images)
    ? ticket.images.map((image) => ({
        ...image,
        url: normalizeUploadUrl(image?.url),
        secure_url: normalizeUploadUrl(image?.secure_url),
      }))
    : ticket.images;

  return {
    ...ticket,
    status: normalizeTicketStatus(ticket.status),
    proof: normalizeUploadUrl(ticket.proof),
    images: normalizedImages,
    createdBy: normalizeUserMedia(ticket.createdBy),
    assignedTo: normalizeUserMedia(ticket.assignedTo),
  };
};

module.exports = {
  STATUS_VARIANTS,
  getStatusVariants,
  getStatusWhere,
  normalizeTicketStatus,
  normalizeTicketEntity,
};
