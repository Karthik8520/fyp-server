const {Router} = require("express");
const {generate_OTP, checkOTP} = require("../../Controllers/user.controller")
const {protect} = require("../../Controllers/auth")

OTP_router = Router();

OTP_router.get("/gen", protect, generate_OTP)
OTP_router.post("/check", protect, checkOTP)

module.exports = OTP_router;