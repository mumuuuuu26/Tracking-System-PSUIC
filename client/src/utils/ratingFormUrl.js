const EXTERNAL_RATING_FORM_URL = (
  import.meta.env.VITE_EXTERNAL_RATING_FORM_URL || ""
).trim();

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

export const getTicketRatingLink = (ticket) => {
  const fallbackUrl = ticket?.id ? `/user/ticket/${ticket.id}` : "/user/history";

  if (!EXTERNAL_RATING_FORM_URL || !isHttpUrl(EXTERNAL_RATING_FORM_URL)) {
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
    if (EXTERNAL_RATING_FORM_URL.includes("{{")) {
      return {
        url: applyTemplate(EXTERNAL_RATING_FORM_URL, values),
        isExternal: true,
      };
    }

    const url = new URL(EXTERNAL_RATING_FORM_URL);
    if (values.ticketId && !url.searchParams.has("ticketId")) {
      url.searchParams.set("ticketId", String(values.ticketId));
    }
    return { url: url.toString(), isExternal: true };
  } catch {
    return { url: fallbackUrl, isExternal: false };
  }
};

