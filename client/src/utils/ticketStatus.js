const STATUS_ALIAS_MAP = {
  not_start: "not_start",
  not_started: "not_start",
  pending: "not_start",
  new: "not_start",
  in_progress: "in_progress",
  inprogress: "in_progress",
  processing: "in_progress",
  completed: "completed",
  complete: "completed",
  done: "completed",
  closed: "completed",
  resolved: "completed",
  rejected: "rejected",
  reject: "rejected",
  declined: "rejected",
  cancelled: "rejected",
  canceled: "rejected",
};

const normalizeToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

export const normalizeTicketStatus = (status) => {
  const token = normalizeToken(status);
  return STATUS_ALIAS_MAP[token] || "not_start";
};

export const toTicketStatusLabel = (status) => {
  switch (normalizeTicketStatus(status)) {
    case "not_start":
      return "Not Start";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return "Not Start";
  }
};
