// controllers/bill.js
const prisma = require("../config/prisma");
const dayjs = require("dayjs");

const dayBounds = (d) => {
  const start = dayjs(d).hour(0).minute(0).second(0).millisecond(0);
  const end = start.add(1, "day");
  return { start: start.toDate(), end: end.toDate() };
};

exports.createBill = async (req, res) => {
  try {
    // body: { plate, categoryId, customerType, weightIn, weightOut, note? }
    const { plate, categoryId, customerType, weightIn, weightOut, note } =
      req.body;

    if (
      !plate ||
      typeof weightIn === "undefined" ||
      typeof weightOut === "undefined"
    ) {
      return res
        .status(400)
        .json({ message: "ข้อมูลไม่ครบ (plate, weightIn, weightOut)" });
    }

    // หา price ของวันนี้
    const { start, end } = dayBounds(new Date());
    const todayRec = await prisma.palmPriceDaily.findFirst({
      where: { date: { gte: start, lt: end } },
    });

    if (!todayRec) {
      return res
        .status(400)
        .json({ message: "ยังไม่มีข้อมูลราคาสำหรับวันนี้" });
    }

    // เลือกราคา ตามประเภทลูกค้า
    const pricePerKg =
      customerType === "large" ? todayRec.priceMax : todayRec.priceAvg;

    const wIn = Number(weightIn || 0);
    const wOut = Number(weightOut || 0);
    const netWeight = Math.max(wIn - wOut, 0);
    const amount = Number((pricePerKg * netWeight).toFixed(2));

    const bill = await prisma.bill.create({
      data: {
        plate,
        categoryId: categoryId ? Number(categoryId) : null,
        customerType: customerType || "retail",
        weightIn: wIn,
        weightOut: wOut,
        netWeight,
        pricePerKg,
        amount,
        note: note || "",
      },
    });

    res.json({ ok: true, bill });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listBills = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: "desc" },
      include: { Category: true },
    });
    res.json(bills);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id: Number(id) },
      include: { Category: true },
    });
    if (!bill) return res.status(404).json({ message: "Not found" });
    res.json(bill);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchByPlate = async (req, res) => {
  try {
    const { plate } = req.query;
    const rows = await prisma.bill.findMany({
      where: { plate: { contains: plate } },
      orderBy: { createdAt: "desc" },
      include: { Category: true },
    });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
