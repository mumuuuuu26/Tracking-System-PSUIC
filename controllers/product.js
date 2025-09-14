const prisma = require("../config/prisma");
const cloudinary = require("cloudinary").v2;

function calc(payload) {
  const price = Number(payload.price || 0);
  const weightIn = Number(payload.weightIn || 0);
  const weightOut = Number(payload.weightOut || 0);
  const netWeight = Math.max(weightIn - weightOut, 0);
  const amount = +(price * netWeight).toFixed(2);
  return {
    price,
    weightIn,
    weightOut,
    netWeight,
    amount,
    quantity: Math.round(netWeight),
  };
}

exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      categoryId,
      images,
      weightIn,
      weightOut,
    } = req.body;

    const c = calc({ price, weightIn, weightOut });

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: c.price,
        quantity: c.quantity,
        weightIn: c.weightIn,
        weightOut: c.weightOut,
        netWeight: c.netWeight,
        amount: c.amount,
        ...(categoryId
          ? { category: { connect: { id: parseInt(categoryId) } } }
          : {}),
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
    const product = await prisma.product.findFirst({
      where: { id: Number(id) },
      include: { category: true, Images: true },
    });
    res.send(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      categoryId,
      images,
      weightIn,
      weightOut,
    } = req.body;
    const productId = Number(req.params.id);

    const oldImages = await prisma.image.findMany({
      where: { productId },
      select: { public_id: true },
    });

    await prisma.image.deleteMany({ where: { productId } });

    await Promise.all(
      oldImages.map((img) =>
        cloudinary.uploader.destroy(img.public_id).catch((e) => {
          console.log("cloudinary destroy error:", img.public_id, e?.message);
          return null;
        })
      )
    );

    const c = calc({ price, weightIn, weightOut });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description,
        price: c.price,
        quantity: c.quantity,
        weightIn: c.weightIn,
        weightOut: c.weightOut,
        netWeight: c.netWeight,
        amount: c.amount,
        ...(categoryId
          ? { category: { connect: { id: parseInt(categoryId) } } }
          : {}),
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

    const images = await prisma.image.findMany({
      where: { productId },
      select: { public_id: true },
    });

    await Promise.all(
      images.map((img) =>
        cloudinary.uploader.destroy(img.public_id).catch((e) => {
          console.log("cloudinary destroy error:", img.public_id, e?.message);
          return null;
        })
      )
    );

    await prisma.product.delete({ where: { id: productId } });

    res.json({ ok: true, message: "Deleted Success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.listby = async (req, res) => {
  try {
    const { sort = "createdAt", order = "desc", limit = 20 } = req.body || {};
    const take = Math.max(Number(limit) || 20, 1);

    const products = await prisma.product.findMany({
      take,
      orderBy: { [sort]: order.toLowerCase() === "asc" ? "asc" : "desc" },
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
    const [min, max] = priceRange || [];
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: Number(min) || 0,
          lte: Number(max) || 999999,
        },
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
    const ids = Array.isArray(categoryId)
      ? categoryId.map((id) => Number(id))
      : [Number(categoryId)];
    const products = await prisma.product.findMany({
      where: { categoryId: { in: ids } },
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
    const { query, category, price } = req.body || {};

    if (query) return await handleQuery(req, res, query);
    if (category) return await handleCategory(req, res, category);
    if (price) return await handlePrice(req, res, price);

    return res.send([]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

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
    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }
    cloudinary.uploader.destroy(public_id, (result) => {
      res.send("Remove Image Success!!!");
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
