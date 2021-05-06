const mongoose  = require("mongoose");

const vehicle_schema = mongoose.Schema({
    number: {
        type: String,
        required: [true, "Vehicle number is required"],
        unique: [true, "vehicle with same number already exists"]
    },
    owner: {
        type:String, 
        required: [true, "Owner name is required"]
    },
    mobileNumber: {
        type: 'String',
        required: [true, "Mobile number is required."]
    },
    address: {
        type:String, 
        required: [true, "Address name is required"]
    },
    stealReportedAt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    // lastSeenAt: Stores the Id of toll-booth through which it passed most recently
    lastSeenAt : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    //nearestPoliceStation: Stores the id of police station which was nearest to the toll-booth.
    nearestPoliceStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    //passedAt represents the time at which it passed through toll-tax 
    passedAt: {
        type: Date
    },
    otp: {
        type: String
    },
    otpValidTill: {
        type: Date
    }
})

module.exports = vehicle_schema;