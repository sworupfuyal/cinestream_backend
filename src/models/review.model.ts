import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  movie: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    user:  { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per movie
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

export const ReviewModel = mongoose.model<IReview>('Review', reviewSchema);