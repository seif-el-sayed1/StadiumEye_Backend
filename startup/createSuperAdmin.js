require("colors");
const asyncHandler = require("express-async-handler");
const Admin = require("../models/admin.model");

const createSuperAdmin = asyncHandler(async () => {
  const admin = await Admin.findOne({isSuperAdmin: true});
  if (!admin) {
    const admin = new Admin({
      firstName: "Super",
      lastName: "Admin",
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      isSuperAdmin: true
    });
    console.log("=== Super Admin created successfully ===".green);
    await admin.save();
  }
});

module.exports = createSuperAdmin;
