const {Router} = require("express")
const {signup, login, protect} = require("../../Controllers/auth");
const {getUserDetails, getUserRole}  = require("../../Controllers/user.controller");

const userRouter = Router();

userRouter.post("/login", login);
userRouter.post("/signup", signup);

userRouter.get("/", protect, getUserDetails);
userRouter.get("/role", protect, getUserRole)


module.exports = userRouter;