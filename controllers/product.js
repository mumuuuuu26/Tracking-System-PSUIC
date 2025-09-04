const prisma = require("../config/prisma");
const { create } = require("./category");
const cloudinary = require("cloudinary").v2;

exports.create = async (req, res) => {
  try {
    //code
    const { title, description, price, quantity, categoryId, images } =
      req.body;
    //console.log(title, description, price, quantity, images)
    const product = await prisma.product.create({
      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category: {
          connect: {
            id: parseInt(categoryId),
          },
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
    //code
    const { count } = req.params;
    const products = await prisma.product.findMany({
      take: parseInt(count),
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        Images: true,
      },
    });

    res.send(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.read = async (req, res) => {
  try {
    //code
    const { id } = req.params;
    const products = await prisma.product.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        category: true,
        Images: true,
      },
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
    //console.log(title, description, price, quantity, images)

    await prisma.image.deleteMany({
      where: {
        productId: Number(req.params.id),
      },
    });

    const product = await prisma.product.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category: {
          connect: {
            id: parseInt(categoryId),
          },
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

exports.remove = async (req, res) => {
  try {
    //code
    const { id } = req.params;
    //ยากก

    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    res.send("Delerted Success");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listby = async (req, res) => {
  try {
    //code //เรียงตามข้อมูลที่ฟร้อนเอ็นส่งมา
    const { sort, order, limit } = req.body;
    console.log(sort, order, limit);
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
    //code
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        category: true,
        Images: true,
      },
    });
    res.send(products);
  } catch (err) {
    //err
    console.log(err);
    res.status(500).send("Search Error");
  }
};
const handlePrice = async (req, res, priceRange) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      },
      include: {
        category: true,
        Images: true,
      },
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
      where: {
        categoryId: {
          in: categoryId.map((id) => Number(id)),
        },
      },
      include: {
        category: true,
        Images: true,
      },
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

    if (query) {
      console.log("query-->", query);
      return await handleQuery(req, res, query);
    } else if (category) {
      console.log("category-->", category);
      return await handleCategory(req, res, category);
    } else if (price) {
      console.log("price-->", price);
      return await handlePrice(req, res, price);
    }

    // กรณีไม่มีเงื่อนไขใดเลย
    return res.send([]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.createImages = async (req, res) => {
  try {
    //code
    //console.log(register.body);
    const result = await cloudinary.uploader.upload(req.body.Image, {
      public_id: `Banklang-${Date.now()}`,
      resource_type: "auto",
      folder: "banklang2025",
    });
    res.send(result);
  } catch (err) {
    //err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.removeImage = async (req, res) => {
  try {
    //code
    const { public_id } = req.body;
    //console.log(public_id);
    cloudinary.uploader.destroy(public_id, (result) => {
      res.send("Remove Image Success!!!");
    });
  } catch (err) {
    //err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
