let otpGenerator = require('otp-generator')
const guj_auth  =  require("../Models/Guj.auth.model");
const guj_stolen = require("../Models/Guj.stolen.model");
const raj_auth = require("../Models/Raj.auth.model");
const raj_stolen = require("../Models/Raj.stolen.model");
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: '3ad49b0e',
  apiSecret: 'tHah4hHJYCmNdc6D',
});
const from = 'Ve-Track App';


exports.getUserDetails = (req, res)=>{
    res.status(200).json({
        status: "success",
        data: req.user
    })
}

exports.getUserRole = (req, res)=>{
    res.status(200).json({
        status: "success",
        data: req.user.role
    })
}

async function sendSMS(to, text){
    await nexmo.message.sendSms(from, to, text)
}

const update_db = async (db_model, id, phone, res)=>{
    try{
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });   
        let currentTime = new Date();
        const otp_valid_time = 5 ; // OTP will be valid till 5 mins
        const otpValid = new Date(currentTime.getTime() + otp_valid_time*60000);
        await db_model.updateOne({_id : id}, {$set : {otp : otp.toString(), otpValidTill : otpValid}});
        
        const SMS_res = await sendSMS(phone, `VE-TRACK : Your OTP is ${otp}, it will be valid till 5 minutes from now.`);
        console.log("SMS response : ", SMS_res);
            res.status(200).json({
                status:"sucess"
            })
        
    }
    catch(err){
        res.status(404).json({
            status: "fail",
            msg: err
        })
    }
    
}

exports.generate_OTP = async (req, res)=>{
    console.log(req.query);
    let phone_number = `91${req.query.phone}`
    if(req.query.number.startsWith("GJ")) //gujarat vehicle
    {
        // 1) update user with OTP
        if(req.query.action=="createReport")
        {
            update_db(guj_auth, req.query.id, phone_number, res)
        }
        else{
            //delete report
            update_db(guj_stolen, req.query.id, phone_number, res)
        }    
    }
    else if(req.query.number.startsWith("RJ")){
        if(req.query.action=="createReport")
        {
            update_db(raj_auth, req.query.id, phone_number, res)
        }
        else{
            //delete Report
            update_db(raj_stolen, req.query.id, phone_number, res)
        }  
    }
}


async function handleCheckOTP(db_model_auth, db_model_stolen, user_id, action, otpInput, res)
{
    const currentTime = new Date();
        if(action==="createReport")
        {
            const user = await db_model_auth.findById(user_id);
            if(otpInput===user.otp && currentTime < user.otpValidTill){
                res.status(200).json({
                    status: "success",
                    result : "correct"
                })
            }
            else{
                res.status(200).json({
                    status: "success",
                    result : "incorrect"
                })
            }
        }
        else{
            const user = await db_model_stolen.findById(user_id);
            if(otpInput===user.otp && currentTime < user.otpValidTill){
                res.status(200).json({
                    status: "success",
                    result : "correct"
                })
            }
            else{
                res.status(200).json({
                    status: "success",
                    result : "incorrect"
                })
            }
        }
    
}


exports.checkOTP = async (req, res)=>{
    const otpInput = req.body.otp;
    const number = req.body.number;
    const user_id = req.body.user_id;
    const action = req.body.action;
    

    console.log("OTP reached at server : ", otpInput);

    if(number.startsWith("GJ"))
    {   
        await handleCheckOTP(guj_auth, guj_stolen, user_id, action, otpInput, res);
    }
    else if(number.startsWith("RJ")){
        await handleCheckOTP(raj_auth, raj_stolen, user_id, action, otpInput, res)
    }

}