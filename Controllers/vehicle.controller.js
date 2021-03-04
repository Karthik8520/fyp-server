const guj_auth = require("../Models/Guj.auth.model")
const guj_stolen = require("../Models/Guj.stolen.model");

const raj_auth = require("../Models/Raj.auth.model");
const raj_stolen = require("../Models/Raj.stolen.model");

const userModel = require("../Models/userModel");

const FormData = require("form-data");
const fetch = require("node-fetch");
const fs = require("fs");


const handle_vehicle_registeration = (db_model, data, res)=>{
    db_model.create(data).then((response)=>{
        res.status(200).json({
            status: "success",
            data: response
        })
    }).catch((err)=>{
        console.log("error from handle register vehicle")
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    })
}


exports.registerVehicle = async (req, res)=>{
    try{
        //console.log(req.body);
        // 1) get posted data
        const data = {
            number : req.body.number.toUpperCase(),
            owner: req.body.owner,
            address: req.body.address
        }    
        console.log(data);

        // // 2) If any data is missing, throw error
        // console.log("number",number)
        if(!data.number || !data.owner || !data.address)
        {
            throw "Vehcile number, owner name and address is required"
        }

        // // 3) check which states number plate is it.
        
        if(data.number.toLowerCase().startsWith("gj"))
        {
            //vehicle is of gujarat
            handle_vehicle_registeration(guj_auth, data, res);
        }
        else if(data.number.toLowerCase().startsWith("rj"))
        {
            //vehicle is of Rajasthan
            handle_vehicle_registeration(raj_auth, data, res);
        }
        else{
            res.status(200).json({
                status: "Can only register vehicle  Gujarat"
            })
        }
    }
    catch(err){
        console.log("error from register vehicle function");
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
        
    }
}


//this function takes as input the number of vehicle and then returns it's details
const getDetails = async(number)=>{

    try{
        if(number.toLowerCase().startsWith("gj"))
        {
            //vehicle is of gujarat
            let veh = await guj_auth.findOne({number});
            if(!veh){veh= await guj_stolen.findOne({number}).populate({path:"stealReportedAt", select:"-_id name address"}).populate({path:"lastSeenAt", select: "-_id name address"}).populate({path:"nearestPoliceStation", select:"-_id name address"})  };
            return veh;
        }
        else if(number.toLowerCase().startsWith("rj"))
        {
            //vehicle is of gujarat
            let veh = await raj_auth.findOne({number});
            if(!veh) {veh = await raj_stolen.findOne({number}).populate({path:"stealReportedAt", select:"-_id name address"}).populate({path:"lastSeenAt", select: "-_id name address"}).populate({path:"nearestPoliceStation", select:"-_id name address"})  };
            return veh;
        }
    }
    catch(err)
    {
        console.log("error from getDetails");
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }

}



exports.getByNumber = async(req, res)=>{
    try{
        const number = String(req.params.number).toUpperCase();
        const veh = await getDetails(number);

        // Check if vehicle exists
        if(!veh) throw "Vehicle does not exist"


        res.status(200).json({
            status: "success",
            data: veh
        })
    }
    catch(err){
        console.log("error from getBy number");
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }
}


const handle_reportStolen = async (auth_db_model, stolen_db_model, id, number, req, res)=>{
    try{

        // 1) Delete from auth db
        let data = await auth_db_model.findByIdAndDelete(id)
        data["stealReportedAt"] = req.user._id;
        data = data._doc;
        data["_id"]=undefined;

        // 2) Store it in stolen db
        await stolen_db_model.create(data);
        res.status(200).json({
            status: "success"
        })
    }
    catch(err)
    {
        console.log("Error from reportStolen")
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }
}


// report stolen vehicle
exports.reportStolen = async (req, res)=>{
    //console.log(req.user);
    // 1) get the id, number of vehicle from Req Body
    const {id, number} = req.body;

    // 1.1) Check if id, veh-number was supplied
    if(!id || !number) throw "Vehicle id or Number not provided"

    // 2) delete the vehicle from auth_vehicles
    if(number.startsWith("GJ"))
    {
        //vehicle belong to guj
        handle_reportStolen(guj_auth, guj_stolen, id, number, req, res);
    }
    else if(number.startsWith("RJ"))
    {
        //vehicle belong to Rajasthan
        handle_reportStolen(raj_auth, raj_stolen, id, number, req, res);
    }
    else{
        res.status(200).json({
            status:"Error",
            msg: "Reporting stolen Only limited to vehicles of Gujarat and Rajasthan"
        })
    }
}


//This function will return the list of vehicles which were reported at logged-in police station
//The police station have to log in first,
exports.getReportedVehicles = async(req, res)=>{

    try{
        const police_station_id = req.user._id;
        let data = [];
        const d1 = await guj_stolen.find({stealReportedAt: police_station_id}).populate({path:"stealReportedAt", select:"-_id name address"}).populate({path: "lastSeenAt", select:"-_id name address"}).populate({path: "nearestPoliceStation", select:"-_id name address"})
        const d2 = await raj_stolen.find({stealReportedAt: police_station_id}).populate({path:"stealReportedAt", select:"-_id name address"}).populate({path: "lastSeenAt", select:"-_id name address"}).populate({path: "nearestPoliceStation", select:"-_id name address"})
        data.push(...d1);
        data.push(...d2);

        res.status(200).json({
            status: "success",
            data
        })
    }
    catch(err)
    {
        console.log("error from getReportedVehicles()");
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }
}


//callback used only in 'tollScan' function
const cb = (err, doc, res)=>{
    console.log("doc ", doc);
    if(doc!=null){
         res.status(200).json({
             status:"success",
             msg:"stolen vehicle, report sent"
         })
    }
}

exports.tollScan = async(req, res)=>{
    console.log("Form Body : ",req.body);
    console.log("Form file : ",req.file);

    try{
        
      let image_path = req.file.path;
      let body = new FormData();
      let number_plate = "";
      body.append('upload', fs.createReadStream(image_path));
      fetch("https://api.platerecognizer.com/v1/plate-reader/", {
        method: 'POST',
        headers: {
            "Authorization": "Token 0ab472408d85b410838bed1ec3eb7b9164cf000f"
        },
        body: body
       }).then(res => res.json())
      .then(async json => {
        
        number_plate = json.results[0].plate;
        number_plate  = number_plate.toUpperCase();
        console.log("num_plate : ", number_plate)

        //delete the image from system
        fs.unlink(req.file.path, (err)=>{
          if(err){
            console.log("failed to delete")
          }
          else{
              console.log("delete success");
          }
        }); 

        //at this point of time we have number plate in 'number_plate' variable
        //code from here

        const lat = req.user.location.coordinates[0];
        const lng = req.user.location.coordinates[1];
        
        let veh = null;
        // 1) Check in auth db of vehicle's state db
        if(number_plate.startsWith("GJ")){ veh = await guj_auth.findOne({number:number_plate}) }
        else if(number_plate.startsWith("RJ")){ veh = await raj_auth.findOne({number:number_plate}) }

        // 1.1) If vehicle is auth, send success msg
        console.log("veh: ", veh);
        if(veh!=null){
            res.status(200).json({
                status:"success",
                msg: "Auth vehicle"
            })
        }

        // 2) If not auth then update stolen vehicles data's 'lastSeenAt' field
        //    set 'lastSeenAt' field to logged in toll-booth ID
        console.log("vehicle stolen, process begins now");
        console.log("lattitude : ", lat);
        console.log("longitude : ", lng);
        //10km radius

        // 2.2) set 'nearestPoliceStation' field of stolen vehicle
            //2 km radius
        const radius = 2/6378.1;
        console.log("radius: ", radius);
        const nearPoliceStations = await userModel.find({$and: [ {role:"police-station" },  { location :{ $geoWithin : { $centerSphere : [[lat, lng], radius] }} } ] })
        let data_to_update = {
            lastSeenAt: req.user._id,
            passedAt: Date.now()
        }
        if(nearPoliceStations.length>0)
        {
            console.log("list of near police stations : ", nearPoliceStations);
            data_to_update["nearestPoliceStation"] = nearPoliceStations[0]._id;
        }

        //console.log(req.user.location.coordinates[1]);
        

        //console.log(near);
        //cb is callback function which is defined just above this function
        
        //guj_stolen.findOneAndUpdate({number:number_plate}, data_to_update, {new:true}, (err, doc)=>cb(err, doc, res));
        //raj_stolen.findOneAndUpdate({number:number_plate}, data_to_update, {new:true}, (err, doc)=>cb(err, doc, res));

        if(number_plate.startsWith("GJ")){
            guj_stolen.findOneAndUpdate({number:number_plate}, data_to_update, {new:true}, (err, doc)=>cb(err, doc, res));
        }
        else if(number_plate.startsWith("RJ")){
            raj_stolen.findOneAndUpdate({number:number_plate}, data_to_update, {new:true}, (err, doc)=>cb(err, doc, res));
        }

        res.status(200).json({
            status: "success"
        })

    
        // 4) If vehicle is not in stolen && auth db then send alert

        

                
      })
    }
    catch(err)
    {
      console.log("error from upload img");
      console.log(err);
      res.status(404).json({
        status: "fail",
        err
      })
    }
}


const all_stolen_models = [guj_stolen, raj_stolen]
exports.getAlerts = async (req, res)=>{
    try{
        const police_station_id = req.user._id;
        let data = [];

        for(i=0;i<all_stolen_models.length;i++)
        {
            const temp = await all_stolen_models[i].find({nearestPoliceStation:police_station_id}).populate({path:"stealReportedAt", select:"-_id name address"}).populate({path:"lastSeenAt", select:"-_id name address"});
            if(temp.length>0){data.push(temp);}
        }
        console.log(data);

        //formatting data...
        let data_to_send = [];
        for(i=0; i<data.length; i++)
        {
            for(j=0; j<data[i].length; j++)
            {
                data_to_send.push(data[i][j]);
            }
        }

        res.status(200).json({
            status: "success",
            data: data_to_send
        })

    }
    catch(err){
        console.log("Error from getAlerts");
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }
    
}


const handle_deleteStolenVehicle_report = async (auth_db_model, stolen_db_model, id, res)=>{

    try{
 
        // 1) Delete from stolen db
        let data = await stolen_db_model.findByIdAndDelete(id)
        data = data._doc;
        //console.log("data : ", data);
        data["stealReportedAt"] = undefined;
        data["lastSeenAt"] = undefined;
        data["nearestPoliceStation"] = undefined;
        data["passedAt"] = undefined;
        data["_id"]=undefined;
        //console.log("data-post : ", data);

        // 2) Store it in auth db
        await auth_db_model.create(data);
        res.status(200).json({
            status: "success"
        })
    }
    catch(err)
    {
        console.log("Error from reportStolen")
        console.log(err);
        res.status(404).json({
            status: "fail",
            err
        })
    }

}

exports.deleteStolenVehicle_report = async (req, res)=>{

     // 1) get the id, number of vehicle from Req Body
     const {id, number} = req.params;

     // 1.1) Check if id, veh-number was supplied
     if(!id || !number) throw "Vehicle id or Number not provided"
 
     // 2) delete the vehicle from stolen_vehicles
     if(number.startsWith("GJ"))
     {
         //vehicle belong to guj
        handle_deleteStolenVehicle_report(guj_auth, guj_stolen, id, res);
     }
     else if(number.startsWith("RJ"))
     {
         //vehicle belong to Rajasthan
         handle_deleteStolenVehicle_report(raj_auth, raj_stolen, id, res);
     }
     else{
         res.status(200).json({
             status:"Error",
             msg: "Reporting stolen Only limited to vehicles of Gujarat and Rajasthan"
         })
     }
}