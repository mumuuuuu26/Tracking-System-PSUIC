const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

exports.register = async (req, res, next) => {
  try {
    // Validate body using Zod
    const { email, password } = registerSchema.parse(req.body);

    // Check Email in DB
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // HashPassword
    const HashPassword = await bcrypt.hash(password, 10);

    // Register
    await prisma.user.create({
      data: {
        email: email,
        password: HashPassword,
      },
    });

    res.json({ message: "Register Success" });
  } catch (err) {
    // Pass to global error handler (which handles ZodError)
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Validate body using Zod
    const { email, password } = loginSchema.parse(req.body);
    
    // Check Email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user || !user.enabled) {
      return res.status(400).json({ message: "User not found or disabled" });
    }

    // Check password — guard against null (PSU-OAuth users have no local password)
    if (!user.password) {
      return res.status(400).json({ message: "This account uses SSO login. Please sign in via PSU Passport." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }
    
    // Create Payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const responsePayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      isEmailEnabled: user.isEmailEnabled,
      notificationEmail: user.notificationEmail,
      googleCalendarId: user.googleCalendarId
    };

    // Generate Token
    jwt.sign(
      tokenPayload,
      process.env.SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) {
          return next(err);
        }
        res.json({ payload: responsePayload, token });
      }
    );
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

exports.currentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        username: true,
        picture: true,
        department: true,
        phoneNumber: true,
        enabled: true, 
        createdAt: true,
        updatedAt: true,
        isEmailEnabled: true,
        notificationEmail: true,
        googleCalendarId: true,
        officeExtension: true,
        workingHoursJson: true
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user data + service account email for calendar sharing instructions
    res.json({
      ...user,
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL
    });
  } catch (err) {
    next(err);
  }
};
