const prisma = require("../config/prisma");

//ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ Admin ดู)
exports.listUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    let where = {};
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.enabled = status === 'active';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        enabled: true,
        department: true, // เพิ่ม department
        phoneNumber: true, // เพิ่ม phoneNumber
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
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

exports.updateProfile = async (req, res) => {
  try {
    const { email, phoneNumber, department, name } = req.body;

    // Validate if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          NOT: { id: req.user.id }
        }
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email,
        phoneNumber,
        department,
        name
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        department: true,
        phoneNumber: true,
        picture: true
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Update Profile Failed" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, phoneNumber, role } = req.body;

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        department,
        phoneNumber,
        role
      },
    });

    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Update Failed" });
  }

};

exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // 1. Unassign pending/active tickets first (regardless of delete method)
    // This allows hard delete to succeed if the ONLY link was 'assignedToId'
    await prisma.ticket.updateMany({
      where: { assignedToId: userId, status: { in: ['in_progress', 'pending'] } },
      data: { assignedToId: null, status: 'pending' }
    });

    // 2. Try HARD DELETE first (to satisfy "Delete from DB")
    try {
      await prisma.user.delete({
        where: { id: userId }
      });
      return res.json({ message: "User permanently deleted" });
    } catch (hardErr) {
      console.log("Hard delete failed, falling back to soft delete:", hardErr.code);

      // 3. Fallback to SOFT DELETE if Hard Delete fails (e.g. Foreign Key constraint on created tickets)
      await prisma.user.update({
        where: { id: userId },
        data: { enabled: false }
      });
      return res.json({ message: "User disabled (History preserved)" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Delete Failed" });
  }
};
