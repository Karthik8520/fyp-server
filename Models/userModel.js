const mongoose  = require("mongoose");
const bcrypt = require("bcrypt")

const pointSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
});


const userSchema = mongoose.Schema({
    name: {
      type: String,
      required: [true, "Name is required"]
    },
    email:{
      type: String,
      required: [true, "Email-id is required"], 
      unique: [true, "User with this email-id already exists!"]
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    address: {
        type: String,
        required: [true, "Address is required"]
    },
    location: {
        type: pointSchema,
        required: [true, "Location is required"]
    },
    role: {
        type: String,
        enum: ["police-station", "toll-booth", "rto"],
        required: [true, "role of user is required"]
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now()
    }
});

//always use regular functions and nor arrow function
//if you use arrow function then 'this' keyword won't work as desired
userSchema.pre("save", async function(next){
  // console.log("is password modified? : ", this.isModified("password"));
  if(!this.isModified("password")) {next(); return;}
  // console.log("hashing password starts..")
  this.password = await bcrypt.hash(this.password, 12);
  // console.log("hashed password : ",this.password);
  // console.log("hashing password ends..");
  next();

});

userSchema.index({location: '2dsphere'})


const userModel = mongoose.model("user", userSchema, "user");

module.exports = userModel;