const mongoose  = require("mongoose");
const vehicle_schema = require("../utils/vehicleSchema");

const raj_auth_model = mongoose.model("raj_auth", vehicle_schema, "raj_auth");
module.exports = raj_auth_model;
