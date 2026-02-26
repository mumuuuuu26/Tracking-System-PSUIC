const toIntOrNull = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const buildTicketRealtimePayload = (ticket) => {
  const createdById = toIntOrNull(ticket?.createdById ?? ticket?.createdBy?.id);
  const assignedToId = toIntOrNull(ticket?.assignedToId ?? ticket?.assignedTo?.id);

  return {
    id: toIntOrNull(ticket?.id),
    title: String(ticket?.title || ""),
    status: String(ticket?.status || ""),
    urgency: String(ticket?.urgency || ""),
    roomId: toIntOrNull(ticket?.roomId ?? ticket?.room?.id),
    createdById,
    assignedToId,
    updatedAt: ticket?.updatedAt || new Date().toISOString(),
  };
};

const emitToRole = (io, role, eventName, payload) => {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(eventName, payload);
};

const emitToUser = (io, userId, eventName, payload) => {
  const parsedUserId = toIntOrNull(userId);
  if (!io || !parsedUserId) return;
  io.to(`user:${parsedUserId}`).emit(eventName, payload);
};

const emitTicketCreated = (io, ticket) => {
  if (!io || !ticket) return;
  const payload = buildTicketRealtimePayload(ticket);

  emitToRole(io, "admin", "server:new-ticket", payload);
  emitToRole(io, "it_support", "server:new-ticket", payload);
  emitToUser(io, payload.createdById, "server:new-ticket", payload);
};

const emitTicketUpdated = (io, ticket) => {
  if (!io || !ticket) return;
  const payload = buildTicketRealtimePayload(ticket);

  emitToRole(io, "admin", "server:update-ticket", payload);
  emitToRole(io, "it_support", "server:update-ticket", payload);
  emitToUser(io, payload.createdById, "server:update-ticket", payload);
  emitToUser(io, payload.assignedToId, "server:update-ticket", payload);
};

module.exports = {
  buildTicketRealtimePayload,
  emitTicketCreated,
  emitTicketUpdated,
};
