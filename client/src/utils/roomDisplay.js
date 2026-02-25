const toCleanString = (value) => String(value ?? "").trim();

export const toFloorDisplay = (value) => {
  const cleaned = toCleanString(value)
    .replace(/^floor\s*/i, "")
    .replace(/^fl\.?\s*/i, "")
    .trim();
  return cleaned || "-";
};

export const toRoomDisplay = (value) => {
  const cleaned = toCleanString(value).replace(/^room\s*/i, "").trim();
  return cleaned || "-";
};

export const toRoomFloorDisplay = (room) => {
  const floor = toFloorDisplay(room?.floor);
  const roomNumber = toRoomDisplay(room?.roomNumber);

  if (floor === "-" && roomNumber === "-") return "-";
  if (floor === "-") return roomNumber;
  if (roomNumber === "-") return floor;
  return `${floor} · ${roomNumber}`;
};
