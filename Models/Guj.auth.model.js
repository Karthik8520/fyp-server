const mongoose  = require("mongoose");
const vehicle_schema = require("../utils/vehicleSchema");

const guj_auth_model = mongoose.model("guj_auth", vehicle_schema, "guj_auth");
module.exports = guj_auth_model;
