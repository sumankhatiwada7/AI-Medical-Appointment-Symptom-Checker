import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./module/auth/auth.route";
import type { ErrorRequestHandler } from "express";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || process.env.frontend_url || "http://localhost:5173",
    credentials: true,
}));
const port = process.env.PORT|| 3000;

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/auth",authRoute)

const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
            message: "Invalid JSON payload",
            success: false,
        });
        return;
    }

    next(err);
};

const fallbackErrorHandler: ErrorRequestHandler = (_err, _req, res, _next) => {
    res.status(500).json({
        message: "Internal server error",
        success: false,
    });
};

app.use(jsonErrorHandler);
app.use(fallbackErrorHandler);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
