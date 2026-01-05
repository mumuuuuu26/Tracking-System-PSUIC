const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");

exports.register = async (req, res) => {
  try {
    //code
    const { email, password } = req.body;
    //Step 1 Validate body
    if (!email) {
      return res.status(400).json({ message: "Email is required!!!" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required!!!" });
    }

    //Step 2 Check Email in DB already?
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (user) {
      return res.status(400).json({ message: "Email already exits!!" });
    }
    //Step 3 HashPassword
    const HashPassword = await bcrypt.hash(password, 10);

    //Step 4 Register
    await prisma.user.create({
      data: {
        email: email,
        password: HashPassword,
      },
    });

    res.send("Register Success");
  } catch (err) {
    //err
    console.log(err);
    res.status(500).json({ message: "Server Errors" });
  }
};

exports.login = async (req, res) => {
  try {
    //code
    const { email, password } = req.body;
    //Step 1 Check Email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user || !user.enabled) {
      return res.status(400).json({ message: "User Not found or not Enabled" });
    }

    //Step 2 Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Password Invalid!!!",
      });
    }
    //Step 3 Create Payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    //Step 4 Generate Token
    jwt.sign(
      payload,
      process.env.SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) {
          return res.status(500).json({
            message: "Server Error",
          });
        }
        res.json({ payload, token });
      }
    );
  } catch (err) {
    //err
    console.log(err);
    res.status(500).json({ message: "Server Errors" });
  }
};

exports.currentUser = async (req, res) => {
  try {
    // ใช้ req.user.id ที่ได้จาก middleware (authCheck)
    const user = await prisma.user.findFirst({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        username: true, // [New] เอามาใช้เป็น Student ID
        picture: true, // [New] เอามาโชว์รูปโปรไฟล์
        department: true, // [New]
        phoneNumber: true, // [New]
        enabled: true, // [New] โชว์สถานะ
        createdAt: true, // [New] โชว์วันที่สมัคร "Member Since..."
        updatedAt: true,
      },
    });


    // ส่งกลับไปตรงๆ เลย Frontend จะได้เรียกใช้ user.name ได้เลย ไม่ต้อง user.user.name
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
