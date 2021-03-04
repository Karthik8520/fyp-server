const mongoose  = require("mongoose");
const vehicle_schema = require("../utils/vehicleSchema");

const guj_stolen_model = mongoose.model("guj_stolen", vehicle_schema, "guj_stolen");
module.exports = guj_stolen_model;
