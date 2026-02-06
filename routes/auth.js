//import....
const express = require("express");
const router = express.Router();
//import controller
const { register, login, currentUser } = require("../controllers/auth");
//import Middleware
const { authCheck, adminCheck } = require("../middlewares/authCheck");

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Register success
 *       400:
 *         description: Validation error or Email exists
 */
router.post("/register", register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success (returns token)
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login);
router.post("/current-user", authCheck, currentUser); //เอาไว้เช็คหน้่าบ้านว่าล็อกอินแล้วหรือยัง
router.post("/current-admin", authCheck, adminCheck, currentUser); //เอาไว้เช็คหน้่าบ้านว่าล็อกอินแล้วหรือยัง

module.exports = router;
