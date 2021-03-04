const express = require("express");
const app = require("./server");
const userRouter = require("./Routes/userRouter/userRouter");
const vehicleRouter = require("./Routes/vehicleRouter/vehicle.Router");
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use("/api/v1/user", userRouter);
app.use("/api/v1/vehicle", vehicleRouter);

