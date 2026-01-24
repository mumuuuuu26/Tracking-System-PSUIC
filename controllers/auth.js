const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate body
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

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

    res.send("Register Success");
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check Email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user || !user.enabled) {
      return res.status(400).json({ message: "User not found or disabled" });
    }

    // Check password
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
      notificationEmail: user.notificationEmail
    };

    // Generate Token
    jwt.sign(
      tokenPayload,
      process.env.SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) {
          return res.status(500).json({
            message: "Server Error",
          });
        }
        res.json({ payload: responsePayload, token });
      }
    );
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.currentUser = async (req, res) => {
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
        notificationEmail: true
      },
    });

    res.json(user);
  } catch (err) {
    console.error("CurrentUser Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
