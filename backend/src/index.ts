import Express = require("express");
import dotenv =require("dotenv");
import cookieParser from "cookie-parser";
const cors = require("cors");
import authRoute from "./module/auth/auth.route.js";

dotenv.config();





const app =Express();
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL||"http://localhost:5173",
}));
const port = process.env.PORT|| 3000;

app.use("/api/v1/auth",authRoute)
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})