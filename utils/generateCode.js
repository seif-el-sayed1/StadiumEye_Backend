const crypto = require("crypto");

const hashCode = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const generateCode = async (req) => {
  // Random 4 digits
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedCode = hashCode(code);
  return { code, hashedCode };
};

module.exports = { generateCode, hashCode };
