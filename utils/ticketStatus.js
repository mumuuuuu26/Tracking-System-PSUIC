const STATUS_VARIANTS = {
  not_start: ["not_start", "not started", "not-start", "notstarted", "pending", "new"],
  in_progress: ["in_progress", "in progress", "in-progress", "inprogress", "processing"],
  completed: ["completed", "complete", "done", "closed", "resolved"],
  rejected: ["rejected", "reject", "declined", "cancelled", "canceled"],
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
  return {
    ...ticket,
    status: normalizeTicketStatus(ticket.status),
  };
};

module.exports = {
  STATUS_VARIANTS,
  getStatusVariants,
  getStatusWhere,
  normalizeTicketStatus,
  normalizeTicketEntity,
};
