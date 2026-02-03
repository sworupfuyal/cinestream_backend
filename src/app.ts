import authRoutes from "./routes/auth.route";
import cors from 'cors';
import useProfileRouter from './routes/user.profile.route';
import path from 'path';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import adminRoutes from "./routes/admin.routes";
const app: Application = express();

const corsOptions = {
    origin:[ 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005' ],
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use("/uploads",express.static(path.join(__dirname,'../uploads')));
app.use("/api/user",useProfileRouter)
app.use("/api/admin", adminRoutes); // 🔑 THIS WAS MISSING


app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

export default app;