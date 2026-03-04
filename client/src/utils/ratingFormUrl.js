const normalizeBasePath = (value) => {
  const raw = String(value || "/").trim();
  if (!raw) return "/";
  if (raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

const withBasePath = (path, basePath) => {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path || "")
    : `/${String(path || "")}`;
  const base = normalizeBasePath(basePath);
  if (base === "/") return normalizedPath;
  return `${base.replace(/\/+$/, "")}${normalizedPath}`;
};

const DEFAULT_EXTERNAL_RATING_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe2rO383UTujd71fYgMwdbHcWuRm4NaKGMEmRIv-T_fya8Dcw/viewform";

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const encodeTemplateValue = (value) =>
  encodeURIComponent(value === undefined || value === null ? "" : String(value));

const applyTemplate = (template, values) =>
  template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    encodeTemplateValue(values[key])
  );

export const getTicketRatingLink = (ticket, options = {}) => {
  const configuredExternalRatingFormUrl =
    options.externalFormUrl ?? import.meta.env.VITE_EXTERNAL_RATING_FORM_URL;
  const externalRatingFormUrl = String(
    configuredExternalRatingFormUrl || DEFAULT_EXTERNAL_RATING_FORM_URL
  ).trim();
  const fallbackPath = ticket?.id ? `/user/ticket/${ticket.id}` : "/user/history";
  const fallbackUrl = withBasePath(
    fallbackPath,
    options.baseUrl ?? import.meta.env.BASE_URL
  );

  if (!externalRatingFormUrl || !isHttpUrl(externalRatingFormUrl)) {
    return { url: fallbackUrl, isExternal: false };
  }

  const values = {
    ticketId: ticket?.id || "",
    ticketTitle: ticket?.title || "",
    ticketDescription: ticket?.description || "",
    roomNumber: ticket?.room?.roomNumber || "",
    floor: ticket?.room?.floor || "",
    category: ticket?.category?.name || "",
    urgency: ticket?.urgency || "",
    status: ticket?.status || "",
  };

  try {
    if (externalRatingFormUrl.includes("{{")) {
      return {
        url: applyTemplate(externalRatingFormUrl, values),
        isExternal: true,
      };
    }

    const url = new URL(externalRatingFormUrl);
    if (values.ticketId && !url.searchParams.has("ticketId")) {
      url.searchParams.set("ticketId", String(values.ticketId));
    }
    return { url: url.toString(), isExternal: true };
  } catch {
    return { url: fallbackUrl, isExternal: false };
  }
};
