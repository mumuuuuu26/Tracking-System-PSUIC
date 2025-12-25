const prisma = require("../config/prisma");

//ดึงรายการงาน My Tasks
exports.getMyTasks = async (req, res) => {
  try {
    // ดึง Ticket ที่ assignedToId ตรงกับคน Login และยังไม่เสร็จ (สถานะไม่ใช่ Fixed)
    const tasks = await prisma.ticket.findMany({
      where: {
        assignedToId: req.user.id,
        NOT: { status: "Fixed" },
      },
      include: {
        room: true,
        equipment: true,
        images: true,
        //createdBy: { select: { name: true, phone: true } }, // ดูเบอร์ติดต่อคนแจ้งได้
      },
      orderBy: { urgency: "desc" }, // งานด่วนขึ้นก่อน
    });
    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

//รับงาน (Accept Job)
exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: "In Progress",
        logs: {
          create: {
            action: "Accept Job",
            detail: "ช่างรับงานแล้ว กำลังดำเนินการ",
            updatedBy: req.user.username || "IT Support",
          },
        },
      },
    });
    res.json(job);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

//ปิดงาน (Close Job + Upload After Photo)
exports.closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { detail, images } = req.body; // รับรายละเอียดการซ่อม และรูปภาพ

    const job = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: "Fixed",
        // บันทึกรูปหลังซ่อม (ถ้ามี)
        images: {
          create:
            images &&
            images.map((img) => ({
              asset_id: img.asset_id,
              public_id: img.public_id,
              url: img.url,
              secure_url: img.secure_url,
              type: "after", // ระบุว่าเป็นรูปหลังซ่อม
            })),
        },
        logs: {
          create: {
            action: "Close Job",
            detail: `ซ่อมเสร็จสิ้น: ${detail || "-"}`,
            updatedBy: req.user.username || "IT Support",
          },
        },
      },
    });
    res.json(job);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
