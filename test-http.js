const jwt = require("jsonwebtoken");
const prisma = require('./config/prisma');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testHttp() {
  try {
    // 1. Get an admin user
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!adminUser) return console.log("No admin found");
    
    // 2. Create token
    const token = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.SECRET,
      { expiresIn: "1h" }
    );
    
    // 3. Create a test user to delete
    const testUser = await prisma.user.create({
      data: { email: "del_test_http@psu.ac.th", name: "Http Test", role: "user" }
    });
    
    console.log("Created test user:", testUser.id, "Admin:", adminUser.id);
    console.log("Token:", token);
    
    // 4. Send request
    const url = `http://localhost:5002/api/users/${testUser.id}`;
    console.log("Sending DELETE to", url);
    const result = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success:", result.data);
  } catch (err) {
    if (err.response) {
      console.log("Response Error:", err.response.status, err.response.data);
    } else {
      console.log("Req Error:", err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}
testHttp();
