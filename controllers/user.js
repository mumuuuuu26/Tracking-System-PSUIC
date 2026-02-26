const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const bcrypt = require("bcryptjs");
const { saveImage } = require("../utils/uploadImage");

const safeUserSelect = {
    id: true,
    email: true,
    username: true,
    name: true,
    role: true,
    enabled: true,
    department: true,
    phoneNumber: true,
    picture: true,
    isEmailEnabled: true,
    notificationEmail: true,
    googleCalendarId: true,
    officeExtension: true,
    workingHoursJson: true,
    createdAt: true,
    updatedAt: true,
};

// Create User (Invite/Promote Existing User)
exports.createUser = async (req, res, next) => {
    try {
        const { email, role, name, password } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedName = String(name || "").trim();
        const normalizedPassword = String(password || "").trim();
        const validRoles = ["user", "it_support", "admin"];
        const selectedRole = role && validRoles.includes(role) ? role : "user";

        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const existingUser = await prisma.user.findFirst({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            const dataToUpdate = {
                role: selectedRole,
                name: normalizedName || existingUser.name,
                enabled: true,
            };

            if (normalizedPassword) {
                if (normalizedPassword.length < 6) {
                    return res.status(400).json({ message: "Password must be at least 6 characters" });
                }
                dataToUpdate.password = await bcrypt.hash(normalizedPassword, 10);
            }

            const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: dataToUpdate,
                select: safeUserSelect,
            });

            return res.json({
                ...updatedUser,
                onboarding: "updated_existing",
            });
        }

        if (!normalizedPassword || normalizedPassword.length < 6) {
            return res.status(400).json({
                message: "Password is required for new non-SSO users and must be at least 6 characters",
            });
        }

        const passwordHash = await bcrypt.hash(normalizedPassword, 10);
        const createdUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: passwordHash,
                role: selectedRole,
                name: normalizedName || normalizedEmail,
                enabled: true,
            },
            select: safeUserSelect,
        });

        return res.status(201).json({
            ...createdUser,
            onboarding: "created_new",
        });
    } catch (err) {
        next(err);
    }
};

// Get a single user by ID (Admin only)
exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                role: true,
                enabled: true,
                department: true,
                phoneNumber: true,
                picture: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
};



//ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ Admin ดู)
exports.listUsers = async (req, res, next) => {
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
    next(err);
  }
};



//เปลี่ยนสถานะผู้ใช้ (Enabled/Disabled)
exports.changeStatus = async (req, res, next) => {
  try {
    const { id, enabled } = req.body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { enabled: enabled },
      select: safeUserSelect,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.changeRole = async (req, res, next) => {
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
      select: safeUserSelect,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    const { image } = req.body;

    // Use utils/uploadImage to save file to disk
    const imageUrl = await saveImage(image, { scope: "profile-image" });

    if (!imageUrl) {
         return res.status(400).json({ message: "Invalid image data" });
    }

    // Save strictly the URL path to database
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { picture: imageUrl },
      select: safeUserSelect,
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
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

    // [DATA FIX] Only include fields that were actually sent in the request.
    // Spreading undefined values into Prisma's data object will set DB columns to null,
    // silently overwriting existing data the user did not intend to change.
    const updateData = {};
    if (typeof email !== 'undefined') updateData.email = email;
    if (typeof phoneNumber !== 'undefined') updateData.phoneNumber = phoneNumber;
    if (typeof department !== 'undefined') updateData.department = department;
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof username !== 'undefined') updateData.username = username;
    if (typeof officeExtension !== 'undefined') updateData.officeExtension = officeExtension;
    if (typeof workingHoursJson !== 'undefined') updateData.workingHoursJson = workingHoursJson;
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
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
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
      select: safeUserSelect,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.removeUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Prevent deleting oneself
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    // Execute everything in a transaction to ensure database consistency
    await prisma.$transaction(async (tx) => {
      // 1. Unassign tickets assigned TO this user (IT Support role)
      // We set assignedToId = null and status = pending so other staff can pick it up
      await tx.ticket.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null, status: 'not_start' }
      });

      // 2. Delete all Notifications belonging to this user
      await tx.notification.deleteMany({
        where: { userId: userId }
      });

      // 3. Delete Personal Tasks
      await tx.personalTask.deleteMany({
        where: { userId: userId }
      });

      // 4. Nullify Activity Logs (Keep history but remove link to user)
      await tx.activityLog.updateMany({
        where: { updatedById: userId },
        data: { updatedById: null }
      });

      // 5. Delete Tickets CREATED by this user
      const userTickets = await tx.ticket.findMany({
        where: { createdById: userId },
        select: { id: true }
      });
      const ticketIds = userTickets.map(t => t.id);

      if (ticketIds.length > 0) {
        await tx.notification.deleteMany({
          where: { ticketId: { in: ticketIds } }
        });

        // Prisma has Cascade for Images, ActivityLogs, so deleting tickets will clean them up.
        await tx.ticket.deleteMany({
          where: { createdById: userId }
        });
      }

      // 6. Finally, Delete the User
      await tx.user.delete({
        where: { id: userId }
      });
    });

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    if (err.code === 'P2003') {
      // Foreign key constraint failed
      return res.status(400).json({ message: "Cannot delete user due to existing dependent records in the database." });
    }
    next(err);
  }
};
