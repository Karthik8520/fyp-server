const mongoose  = require("mongoose");
const vehicle_schema = require("../utils/vehicleSchema");

const raj_stolen_model = mongoose.model("raj_stolen", vehicle_schema, "raj_stolen");
module.exports = raj_stolen_model;
