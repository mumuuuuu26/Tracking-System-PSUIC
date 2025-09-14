const express = require("express");
const router = express.Router();

// Controllers
const {
  create,
  list,
  read,
  update,
  remove,
  listby,
  searchFilters,
  createImages,
  removeImage,
} = require("../controllers/product");

const { authCheck, adminCheck } = require("../middlewares/authCheck");

//ENDPOINT http://localhost:5001/api/product
router.post("/product", authCheck, adminCheck, create);
router.get("/products/:count", list);
router.get("/product/:id", read);
router.put("/product/:id", authCheck, adminCheck, update);

router.delete("/product/:id", authCheck, adminCheck, remove);

router.post("/productby", listby);
router.post("/search/filters", searchFilters);
router.post("/images", authCheck, adminCheck, createImages);
router.post("/removeimages", authCheck, adminCheck, removeImage);

module.exports = router;
