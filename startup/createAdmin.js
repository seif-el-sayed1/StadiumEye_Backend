require("colors");
const asyncHandler = require("express-async-handler");
const Admin = require("../models/admin.model");

const createAdmin = asyncHandler(async () => {
  const admin = await Admin.findOne({email: process.env.ADMIN_EMAIL});
  if (!admin) {
    const admin = new Admin({
      firstName: "Stadium",
      lastName: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log("=== Stadium Admin created successfully ===".green);
    await admin.save();
  }
});

module.exports = createAdmin;
