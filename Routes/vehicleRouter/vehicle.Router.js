const {Router}  = require("express");
const { registerVehicle, getByNumber, reportStolen, getReportedVehicles, tollScan, getAlerts, deleteStolenVehicle_report } = require("../../Controllers/vehicle.controller");
const {protect, restrict} = require("../../Controllers/auth")
const {nanoid} = require("nanoid")
const multer =  require("multer");
const tesseract = require("node-tesseract-ocr");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, nanoid()+"."+file.mimetype.split("/")[1]);
    }
  })

const upload = multer({storage: storage});


//tesseract configurations
// const config = {
//     lang: "eng",
//     oem: 1,
//     psm: 3,
//   }


const vehicleRouter = Router();

vehicleRouter.route("/")
            .post(registerVehicle);

vehicleRouter.get("/:number", protect, restrict("police-station") , getByNumber);
vehicleRouter.post("/stolen", protect,restrict("police-station"),   reportStolen);
vehicleRouter.get("/reports/all", protect, restrict("police-station"),  getReportedVehicles);

//this route is only for toll-booth person
vehicleRouter.post("/upload/img", upload.single("num-plate"), protect, restrict("toll-booth"),  tollScan);

vehicleRouter.get("/alerts/all", protect, restrict("police-station"), getAlerts);
vehicleRouter.delete("/delete/:number/:id", protect, restrict("police-station"), deleteStolenVehicle_report);


module.exports = vehicleRouter;