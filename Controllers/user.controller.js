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