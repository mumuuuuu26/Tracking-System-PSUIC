const prisma = require("../config/prisma");
const cloudinary = require("cloudinary").v2;

exports.create = async (req, res) => {
  try {
    const { title, description, price, quantity, categoryId, images } =
      req.body;

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category: {
          connect: { id: parseInt(categoryId) },
        },
        Images: {
          create: (images || []).map((item) => ({
            asset_id: item.asset_id,
            public_id: item.public_id,
            url: item.url,
            secure_url: item.secure_url,
          })),
        },
      },
    });

    res.send(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const { count } = req.params;
    const products = await prisma.product.findMany({
      take: parseInt(count),
      orderBy: { createdAt: "desc" },
      include: { category: true, Images: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await prisma.product.findFirst({
      where: { id: Number(id) },
      include: { category: true, Images: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, price, quantity, categoryId, images } =
      req.body;
    const productId = Number(req.params.id);

    // ดึงรูปเก่า
    const oldImages = await prisma.image.findMany({
      where: { productId },
      select: { public_id: true },
    });

    // ลบรูปเก่าจาก DB
    await prisma.image.deleteMany({ where: { productId } });

    // ลบรูปเก่าจาก Cloudinary
    await Promise.all(
      oldImages.map((img) =>
        cloudinary.uploader.destroy(img.public_id).catch((e) => {
          console.log("cloudinary destroy error:", img.public_id, e?.message);
          return null;
        })
      )
    );

    // อัปเดตสินค้า
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category: { connect: { id: parseInt(categoryId) } },
        Images: {
          create: (images || []).map((item) => ({
            asset_id: item.asset_id,
            public_id: item.public_id,
            url: item.url,
            secure_url: item.secure_url,
          })),
        },
      },
      include: { Images: true, category: true },
    });

    res.send(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    // ดึง public_id ของรูปทั้งหมด
    const images = await prisma.image.findMany({
      where: { productId },
      select: { public_id: true },
    });

    // ลบรูปบน Cloudinary
    await Promise.all(
      images.map((img) =>
        cloudinary.uploader.destroy(img.public_id).catch((e) => {
          console.log("cloudinary destroy error:", img.public_id, e?.message);
          return null;
        })
      )
    );

    // ลบสินค้า (Image ใน DB ถูก cascade ลบออกด้วย)
    await prisma.product.delete({ where: { id: productId } });

    res.json({ ok: true, message: "Deleted Success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.listby = async (req, res) => {
  try {
    const { sort, order, limit } = req.body;
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { [sort]: order },
      include: { category: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const handleQuery = async (req, res, query) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
      },
      include: { category: true, Images: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).send("Search Error");
  }
};

const handlePrice = async (req, res, priceRange) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        price: { gte: priceRange[0], lte: priceRange[1] },
      },
      include: { category: true, Images: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Search Error" });
  }
};

const handleCategory = async (req, res, categoryId) => {
  try {
    const products = await prisma.product.findMany({
      where: { categoryId: { in: categoryId.map((id) => Number(id)) } },
      include: { category: true, Images: true },
    });
    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Search Error" });
  }
};

exports.searchFilters = async (req, res) => {
  try {
    const { query, category, price } = req.body;

    if (query) return await handleQuery(req, res, query);
    if (category) return await handleCategory(req, res, category);
    if (price) return await handlePrice(req, res, price);

    return res.send([]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.createImages = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.body.Image, {
      public_id: `Banklang-${Date.now()}`,
      resource_type: "auto",
      folder: "banklang2025",
    });
    res.send(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    cloudinary.uploader.destroy(public_id, (result) => {
      res.send("Remove Image Success!!!");
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
