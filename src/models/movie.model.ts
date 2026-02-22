import mongoose, { Document, Schema } from "mongoose";
import { MovieType } from "../types/movie.type";

const MovieSchema: Schema = new Schema<MovieType>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true }, // in minutes
        releaseYear: { type: Number, required: true },
        genres: { type: [String], required: true, default: [] },
        cast: { type: [String], required: true, default: [] },
        director: { type: String, required: true },
        thumbnailUrl: { type: String },
        videoUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

export interface IMovie extends MovieType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const MovieModel = mongoose.model<IMovie>('Movie', MovieSchema);