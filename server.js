const dotenv = require("dotenv");
const express = require("express");
const mongoose  = require("mongoose");

dotenv.config({path: "./config.env"});
const app = express();

//console.log(process.env);

mongoose.connect(process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD)).then(()=>{
    console.log("database connection success");
}).catch((err)=>{
    console.log("Databse connection failed", err);
})


const port = 7000;
app.listen(port, ()=>{
    console.log("Server is listening at port: ", port);
})

module.exports = app;