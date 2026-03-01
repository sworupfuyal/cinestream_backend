import authRoutes from "./routes/auth.route";
import cors from 'cors';
import useProfileRouter from './routes/user.profile.route';
import path from 'path';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import adminRoutes from "./routes/admin.routes";
import movieRouter from "./routes/movie.route";
import userListRouter from "./routes/user.list.route";
import publicMoviesRouter from "./routes/public.movie.router";
import reviewRoutes from "./routes/review.routes";

const app: Application = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:3005',
    'http://192.168.137.1:6050', 
    'https://cinestream-web.vercel.app',
    // ← add this
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

//  Serve regular uploads (images, etc.)
app.use("/uploads", express.static(path.join(__dirname, '../uploads')));

//  Serve HLS files with required CORS headers for video streaming
app.use("/uploads/hls", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    next();
}, express.static(path.join(__dirname, '../uploads/hls')));

app.use("/api/user", useProfileRouter);
app.use("/api/admin/movies", movieRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/user/lists", userListRouter);
app.use("/api/movies", publicMoviesRouter);
app.use('/api/reviews', reviewRoutes);


app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

export default app;