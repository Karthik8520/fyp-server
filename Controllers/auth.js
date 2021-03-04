const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {promisify} = require('util');

async function generateToken(id)
{
    const token = await promisify(jwt.sign)({id}, process.env.JWT_PASSWORD, {expiresIn: process.env.JWT_EXPIRES});
    return token;
}



exports.signup = async (req, res)=>{
    console.log("signup called");
    let user;
    try{
        // 1) get location, address and role from POSTed request
        const data = {
            name : req.body.name,
            email: req.body.email,
            password: req.body.password,
            location: req.body.location,
            address: req.body.address,
            role: req.body.role
        }
        user = await userModel.create(data);
        // console.log(user);

        //***********************8*/
        //we don't provide token at signup, as what was happening here is that saving in Database is slower than generatign token...
        //...so token was generated first and then password was saved into Database.
        //Thus it always threw error message that "passwrod was changed after token was issued"
        // 2) create JWT
        //const token = await generateToken(user._id);

        //password is set to undefined, as we should not send hashed password to client.
        user.password = undefined;
        res.status(200).json({
            status: "Success",
            msg:"Your account is ceated, please Login to continue.",
            //token,
            user
        });
    }
    catch(err)
    {
        // await user.delete();
        console.log(err);
        res.status(404).json({
            status:"error",
            err
        })
    }
}



exports.login = async (req, res)=>{

    try
    {
        // 1) Check if user exists with given email
        const email = req.body.email,
        password = req.body.password;

        //this will return an object with id and password if user exists
        const user = await userModel.findOne({email}).select("password");

        if(!user) {throw "User does not exist"}

        // 2) check if password provided is correct
        const hashed_password = user.password
        const isPasswordCorrect = await bcrypt.compare(password, hashed_password);
        if(!isPasswordCorrect) {throw "Password is incorrect"}

        // 3) generate token
        const token = await generateToken(user._id);

        // 4) pass token to user
        res.status(200).json({
            status:"Success" ,
            token
        })
    }
    catch(err)
    {
        console.log(err);
        res.status(404).json({
            status:"Error",
            err
        })
    }
}







//*******Protect middleware *******//
// This is middleware for protecting routes from unautheticated access
// Every request for resource has to go through this middleware.
// token has to be passed in req header.

exports.protect = async (req, res, next)=>{
    
    try{
        token = req.headers.token;
        // 1) Check if token is passed
        if(!token) {throw "Token not passed"}
        
        // 2) Check if the token is valid

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_PASSWORD);
            // we don't have to check if(!decoded) here
            // As if the token is not valid then error will be thrown automatically.
        //console.log(decoded);
        const {id, iat, exp} = decoded;

        // 3) Check if user still exist or not.

        const user  = await userModel.findById(id);
        if(!user) {throw "User does not exist"}

        // 4) Check if password was changed after token was issued
        let passwordChangedAt = user.passwordChangedAt;
        passwordChangedAt = passwordChangedAt.getTime();
        console.log(passwordChangedAt, iat);
        
        if((iat*1000) < passwordChangedAt) {throw "password changed after token is issued. Login again"}

        // 5) Allow the user to continue
        req.user = user;
        next();
    }
    catch(err){
        console.log(err);
        res.status(404).json({
            status:"Error",
            err
        })
    }
}


//******Restrict middleware ******/
// This middleware is for Authorization
exports.restrict = (...roles)=>{
    return async (req, res, next)=>{
        try{
            const user = req.user;
            let userRole = await userModel.findById(user._id).select("role");
            userRole = userRole.role;
            //console.log(req);
            
            if(!roles.includes(userRole)) {throw "You are not Authorized for this operation!!"}
            next();
        }
        catch(err)
        {
            console.log(err);
            res.status(404).json({
                status:"Error",
                msg: "You are not authorized",
                err
            })
        }
    }
}


