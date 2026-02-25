// controllers/equipment.js
const prisma = require("../config/prisma");
const QRCode = require("qrcode");

const QR_QUERY_PARAM_KEYS = ["qr", "qrcode", "code", "equipment", "id"];
const QR_PUBLIC_BASE_URL_KEYS = ["QR_PUBLIC_BASE_URL", "FRONTEND_URL", "CLIENT_URL"];
const equipmentScanInclude = {
  room: true,
  tickets: {
    where: { status: { not: "completed" }, isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      category: true,
      createdBy: { select: { name: true } },
    },
  },
};

const pushLookupCandidate = (targetSet, value) => {
  if (!value) return;
  const normalized = String(value).trim();
  if (!normalized) return;

  targetSet.add(normalized);

  const withoutQuotes = normalized.replace(/^["']|["']$/g, "").trim();
  if (withoutQuotes && withoutQuotes !== normalized) {
    targetSet.add(withoutQuotes);
  }

  try {
    const decoded = decodeURIComponent(withoutQuotes);
    if (decoded && decoded !== withoutQuotes) {
      targetSet.add(decoded.trim());
    }
  } catch {
    // Ignore malformed URI component.
  }
};

const collectQrLookupCandidates = (rawInput) => {
  const candidates = new Set();
  pushLookupCandidate(candidates, rawInput);

  const text = String(rawInput || "").trim();
  if (!text) return [];

  try {
    const parsedUrl = new URL(text);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const qrIndex = pathParts.findIndex((part) => part.toLowerCase() === "qr");
    const equipmentIndex = pathParts.findIndex((part) => part.toLowerCase() === "equipment");

    if (qrIndex >= 0 && pathParts[qrIndex + 1]) {
      pushLookupCandidate(candidates, pathParts[qrIndex + 1]);
    }

    if (equipmentIndex >= 0 && pathParts[equipmentIndex + 1]) {
      pushLookupCandidate(candidates, pathParts[equipmentIndex + 1]);
    }

    for (const key of QR_QUERY_PARAM_KEYS) {
      pushLookupCandidate(candidates, parsedUrl.searchParams.get(key));
    }

    if (pathParts.length > 0) {
      pushLookupCandidate(candidates, pathParts[pathParts.length - 1]);
    }
  } catch {
    // Not a URL string; raw candidate is already included.
  }

  return [...candidates];
};

const normalizePublicBaseUrl = (value) => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  const withProtocol = /^https?:\/\//i.test(normalized)
    ? normalized
    : `http://${normalized}`;

  try {
    const parsed = new URL(withProtocol);
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
};

const getHeaderValue = (req, headerName) => {
  if (!req) return "";
  if (typeof req.get === "function") {
    return req.get(headerName) || "";
  }
  return req.headers?.[String(headerName).toLowerCase()] || "";
};

const resolveRequestOrigin = (req) => {
  const forwardedProto = String(getHeaderValue(req, "x-forwarded-proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const protocol = forwardedProto || req?.protocol || "http";
  const forwardedHost = String(getHeaderValue(req, "x-forwarded-host") || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || getHeaderValue(req, "host");
  if (!host) return null;
  return `${protocol}://${host}`;
};

const resolveQrPublicBaseUrl = (req) => {
  for (const key of QR_PUBLIC_BASE_URL_KEYS) {
    const fromEnv = normalizePublicBaseUrl(process.env[key]);
    if (fromEnv) return fromEnv;
  }
  return normalizePublicBaseUrl(resolveRequestOrigin(req)) || "http://localhost:5002";
};

const buildQrScanUrl = (req, qrCodeValue) => {
  const baseUrl = resolveQrPublicBaseUrl(req);
  const scanUrl = new URL("/scan", baseUrl);
  scanUrl.searchParams.set("qr", qrCodeValue);
  return scanUrl.toString();
};

const attachCategoryObject = async (equipment) => {
  if (!equipment || !equipment.type) {
    return equipment;
  }

  const category = await prisma.category.findUnique({
    where: { name: equipment.type },
    include: { subComponents: true },
  });
  if (category) {
    equipment.categoryObj = category;
  }

  return equipment;
};

const findEquipmentByLookupCode = async (lookupCode) => {
  const cleanedLookup = String(lookupCode || "").trim();
  if (!cleanedLookup) return null;

  let equipment = await prisma.equipment.findUnique({
    where: { qrCode: cleanedLookup },
    include: equipmentScanInclude,
  });

  if (!equipment) {
    equipment = await prisma.equipment.findFirst({
      where: { serialNo: cleanedLookup },
      include: equipmentScanInclude,
    });
  }

  if (!equipment && /^\d+$/.test(cleanedLookup)) {
    equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(cleanedLookup, 10) },
      include: equipmentScanInclude,
    });
  }

  if (!equipment) return null;
  return attachCategoryObject(equipment);
};

// 1. สร้างอุปกรณ์พร้อม Generate QR Code
exports.create = async (req, res, next) => {
  try {
    const { name, type, serialNo: inputSerialNo, roomId } = req.body;

    // Auto-generate Serial Number if not provided
    const serialNo = inputSerialNo || `SN-${Date.now()}`;

    // สร้าง Equipment ก่อนเพื่อเอา ID มาทำ QR
    const equipment = await prisma.equipment.create({
      data: {
        name,
        type,
        serialNo,
        roomId: parseInt(roomId),
      },
    });

    // Generate Unique QR Code String
    const qrData = `EQUIPMENT_${equipment.id}_${Date.now()}`;

    // Update Equipment กลับไปด้วย qrData ที่ gen มา
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipment.id },
      data: { qrCode: qrData },
      include: { room: true },
    });

    const qrScanUrl = buildQrScanUrl(req, qrData);
    // สร้าง Base64 Image สำหรับส่งให้ Front-end แสดงผลทันที
    const qrCodeImage = await QRCode.toDataURL(qrScanUrl);

    res.json({
      ...updatedEquipment,
      qrCodeImage,
      qrScanUrl,
    });
  } catch (err) {
    next(err);
  }
};

// 2. ดูรายการอุปกรณ์ทั้งหมด (สำหรับหน้า Admin/Dashboard)
exports.list = async (req, res, next) => {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        room: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { id: "desc" },
    });
    res.json(equipments);
  } catch (err) {
    next(err);
  }
};

// 3. ดึงข้อมูลอุปกรณ์จาก QR Code (สำหรับหน้า Scan QR ของ User)
exports.getByQRCode = async (req, res, next) => {
  try {
    const lookupCandidates = collectQrLookupCandidates(req.params.qrCode);

    let equipment = null;
    for (const lookupCode of lookupCandidates) {
      // eslint-disable-next-line no-await-in-loop
      equipment = await findEquipmentByLookupCode(lookupCode);
      if (equipment) {
        break;
      }
    }

    if (!equipment) {
      return res.status(404).json({ message: "ไม่พบข้อมูลอุปกรณ์นี้ในระบบ" });
    }

    res.json(equipment);
  } catch (err) {
    next(err);
  }
};

// 4. ดึงข้อมูลอุปกรณ์จาก ID พร้อมสถิติ (Enhanced Version)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        tickets: {
          // No status filter here — fetch all tickets so activeIssues can be calculated correctly
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            category: true,
            createdBy: { select: { name: true, email: true } },
            assignedTo: { select: { name: true } },
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // คำนวณข้อมูลเพิ่มเติมก่อนส่งกลับ (Computed Fields)
    const enhancedEquipment = {
      ...equipment,
      totalTickets: equipment._count.tickets,
      activeIssues: equipment.tickets.filter((t) =>
        ["not_start", "in_progress"].includes(t.status)
      ).length,
      lastMaintenance:
        equipment.tickets
          .filter((t) => t.status === "completed")
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
          ?.updatedAt || null,
    };

    res.json(enhancedEquipment);
  } catch (err) {
    next(err);
  }
};

// 5. Generate QR Code Image ใหม่ (กรณีต้องการดาวน์โหลดซ้ำ)
exports.generateQR = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: { room: true },
    });

    if (!equipment || !equipment.qrCode) {
      return res.status(400).json({ message: "No QR Code for this equipment" });
    }

    const qrScanUrl = buildQrScanUrl(req, equipment.qrCode);
    const qrCodeImage = await QRCode.toDataURL(qrScanUrl);

    res.json({
      qrCodeImage,
      equipment,
      qrScanUrl,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, serialNo, roomId, status } = req.body;

    const equipment = await prisma.equipment.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        serialNo,
        ...(roomId !== undefined && roomId !== '' && { roomId: parseInt(roomId) }),
        status
      },
      include: { room: true }
    });

    res.json(equipment);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if has active tickets
    const activeTickets = await prisma.ticket.count({
      where: {
        equipmentId: parseInt(id),
        status: { notIn: ["completed", "rejected"] }
      }
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        message: "Cannot delete equipment with active tickets"
      });
    }

    await prisma.equipment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Equipment deleted successfully" });
  } catch (err) {
    next(err);
  }
};
