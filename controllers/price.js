const prisma = require("../config/prisma");
const { fetchPalmPrice } = require("../services/palmPriceFetcher");
const dayjs = require("dayjs");

const dayBounds = (d) => {
  const start = dayjs(d).hour(0).minute(0).second(0).millisecond(0);
  const end = start.add(1, "day");
  return { start: start.toDate(), end: end.toDate() };
};

exports.getToday = async (req, res) => {
  try {
    const { start, end } = dayBounds(new Date());
    const rec = await prisma.palmPriceDaily.findFirst({
      where: { date: { gte: start, lt: end } },
    });
    if (!rec) return res.status(204).send();
    res.json(rec);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRange = async (req, res) => {
  try {
    const from = req.query.from
      ? dayjs(req.query.from).toDate()
      : dayjs().subtract(30, "day").toDate();
    const to = req.query.to
      ? dayjs(req.query.to).add(1, "day").toDate()
      : dayjs().add(1, "day").toDate();

    const rows = await prisma.palmPriceDaily.findMany({
      where: { date: { gte: from, lt: to } },
      orderBy: { date: "desc" },
    });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.refreshFromSource = async (req, res) => {
  try {
    const d = await fetchPalmPrice();

    const saved = await prisma.palmPriceDaily.upsert({
      where: { date: d.date },
      update: {
        priceMin: d.priceMin,
        priceAvg: d.priceAvg,
        priceMax: d.priceMax,
        sourceName: d.sourceName,
        sourceUrl: d.sourceUrl,
        fetchedAt: new Date(),
        note: null,
      },
      create: {
        date: d.date,
        priceMin: d.priceMin,
        priceAvg: d.priceAvg,
        priceMax: d.priceMax,
        sourceName: d.sourceName,
        sourceUrl: d.sourceUrl,
      },
    });

    res.json(saved);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message || "Refresh failed" });
  }
};

exports.upsertManual = async (req, res) => {
  try {
    const { date, priceMin, priceAvg, priceMax, note } = req.body;
    if (
      [priceMin, priceAvg, priceMax].some(
        (v) => typeof v !== "number" || v <= 0
      )
    )
      return res.status(400).json({ message: "ราคาต้องเป็นตัวเลขมากกว่า 0" });

    const day = dayjs(date || new Date())
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .toDate();

    const saved = await prisma.palmPriceDaily.upsert({
      where: { date: day },
      update: {
        priceMin,
        priceAvg,
        priceMax,
        note: note || "manual",
        sourceName: "Manual",
        sourceUrl: "",
        fetchedAt: new Date(),
      },
      create: {
        date: day,
        priceMin,
        priceAvg,
        priceMax,
        sourceName: "Manual",
        sourceUrl: "",
        note: note || "manual",
      },
    });
    res.json(saved);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
