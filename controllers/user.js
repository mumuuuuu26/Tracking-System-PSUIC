const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const bcrypt = require("bcryptjs");
const { saveImage } = require("../utils/uploadImage");

// Create User (Invite)
exports.createUser = async (req, res) => {
    try {
        const { email, role, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password (default: 123456 if not provided)
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password || "123456", salt);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashPassword,
                role: role || 'user',
                name: name || undefined,
                enabled: true
            }
        });

        res.json(newUser);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

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
    logger.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.listITStaff = async (req, res) => {
  try {
    const itUsers = await prisma.user.findMany({
      where: { role: 'it_support', enabled: true },
      select: { id: true, name: true }
    });
    res.json(itUsers);
  } catch (err) {
    logger.error(err);
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
    logger.error(err);
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
    logger.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    const { image } = req.body;

    // Use utils/uploadImage to save file to disk
    const imageUrl = saveImage(image);

    if (!imageUrl) {
         return res.status(400).json({ message: "Invalid image data" });
    }

    // Save strictly the URL path to database
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { picture: imageUrl },
    });

    res.json(user);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { email, phoneNumber, department, name, username, isEmailEnabled, notificationEmail, googleCalendarId, officeExtension, workingHoursJson } = req.body;

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

    const updateData = {
      email,
      phoneNumber,
      department,
      name,
      username,
      officeExtension,
      workingHoursJson
    };

    // Only update if provided (handle boolean/null correctly)
    if (typeof isEmailEnabled !== 'undefined') updateData.isEmailEnabled = isEmailEnabled;
    if (typeof notificationEmail !== 'undefined') updateData.notificationEmail = notificationEmail;
    if (typeof googleCalendarId !== 'undefined') updateData.googleCalendarId = googleCalendarId.trim();

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        department: true,
        phoneNumber: true,
        picture: true,
        isEmailEnabled: true,
        notificationEmail: true,
        googleCalendarId: true,
        officeExtension: true,
        workingHoursJson: true
      }
    });

    // [NEW] Auto-sync if googleCalendarId is updated/present
    if (updatedUser.googleCalendarId) {
      try {
        const { syncUserCalendar } = require("../utils/syncService");
        await syncUserCalendar(updatedUser.id, updatedUser.googleCalendarId);
      } catch (syncErr) {
        logger.error("Auto-sync failed:", syncErr.message);
        // We don't fail the request, just log it. The user will see the updated ID but maybe not events yet.
      }
    }

    res.json(updatedUser);
  } catch (err) {
    logger.error(err);
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
    logger.error(err);
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

    // 3. Delete all Notifications belonging to this user
    await prisma.notification.deleteMany({
      where: { userId: userId }
    });

    // 4. Delete Personal Tasks
    await prisma.personalTask.deleteMany({
      where: { userId: userId }
    });

    // 5. Nullify Activity Logs (Keep history but remove link to user)
    await prisma.activityLog.updateMany({
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
    logger.error("Delete error:", err);
    res.status(500).json({ message: "Delete Failed", error: err.message });
  }
};
