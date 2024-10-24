const jose = require("jose");
require("dotenv").config();

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const jwtHelper = {
  generateToken: async (payload) => {
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15d")
      .sign(secret);
  },
  verifyToken: async (token) => {
    console.log("🚀 ~ verifyToken: ~ token:", token);
    return await jose.jwtVerify(token, secret);
  },
};

module.exports = jwtHelper;
