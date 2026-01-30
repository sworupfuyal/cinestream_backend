import dotenv from "dotenv";
import cors from 'cors';
dotenv.config();

export const PORT: number = 
    process.env.PORT ? parseInt(process.env.PORT) : 6050;
export const MONGODB_URI: string = 
    process.env.MONGODB_URI || 'mongodb://localhost:27017/defaultdb';

export const JWT_SECRET: string = 
    process.env.JWT_SECRET || 'your_jwt_secret_key'