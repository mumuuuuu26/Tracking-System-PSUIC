// controllers/user.js
const { json } = require("express");
const prisma = require("../config/prisma");
const { create } = require("./category");
const { connect } = require("../routes/category");

//ค้นหาบิลตามทะเบียนรถ
exports.searchMyBills = async (req, res) => {
  try {
    const { plateNumber, dateFrom, dateTo } = req.query;

    // where condition
    let where = {};

    // ค้นหาจากทะเบียนรถ
    if (plateNumber) {
      where.title = {
        contains: plateNumber,
        mode: "insensitive",
      };
    }

    // กรองตามวันที่
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const bills = await prisma.product.findMany({
      where,
      include: {
        category: true,
        Images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      ok: true,
      total: bills.length,
      bills,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
