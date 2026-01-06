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
        picture: true,     // [New] Include profile picture
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
    const { email, phoneNumber, department, name, username } = req.body;

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

    // [New] Validate if username is already taken
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: req.user.id }
        }
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email,
        phoneNumber,
        department,
        name,
        username
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

    // 1. Unassign tickets assigned TO this user (IT Support role)
    // We set assignedToId = null and status = pending so other staff can pick it up
    await prisma.ticket.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, status: 'pending' }
    });

    // 2. Delete all Appointments where this user is the IT Support
    // (Tickets will lose their appointment linkage, but remain in system)
    await prisma.appointment.deleteMany({
      where: { itSupportId: userId }
    });

    // 3. Delete all Notifications belonging to this user
    await prisma.notification.deleteMany({
      where: { userId: userId }
    });

    // 4. Delete IT Availability records
    await prisma.iTAvailability.deleteMany({
      where: { userId: userId }
    });

    // 5. Nullify Activity Logs (Keep history but remove link to user)
    await prisma.activityLog.updateMany({
      where: { updatedById: userId },
      data: { updatedById: null }
    });

    // 6. Nullify Knowledge Base edits
    await prisma.knowledgeBase.updateMany({
      where: { updatedById: userId },
      data: { updatedById: null }
    });

    // 7. Delete Tickets CREATED by this user
    // Prisma schema has onDelete: Cascade for Ticket->Image, Ticket->ActivityLog, Ticket->Appointment
    // So this will clean up all associated ticket data automatically.
    await prisma.ticket.deleteMany({
      where: { createdById: userId }
    });

    // 8. Finally, Delete the User
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: "User and all associated data permanently deleted" });

  } catch (err) {
    console.log("Delete error:", err);
    res.status(500).json({ message: "Delete Failed", error: err.message });
  }
};
