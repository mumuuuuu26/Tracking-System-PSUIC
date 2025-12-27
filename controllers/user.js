const prisma = require("../config/prisma");

//ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ Admin ดู)
exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true, // เพิ่ม username (รหัสนักศึกษา)
        name: true,
        role: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

//เปลี่ยนสถานะผู้ใช้ (Enabled/Disabled)
exports.changeStatus = async (req, res) => {
  try {
    const { id, enabled } = req.body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { enabled: enabled },
    });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { id, role } = req.body;

    // ตรวจสอบว่า Role ที่ส่งมาถูกต้องไหม
    const validRoles = ["user", "it_support", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid Role" });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role: role },
    });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    const { image } = req.body;

    // Save image directly to database (Base64)
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { picture: image },
    });

    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

