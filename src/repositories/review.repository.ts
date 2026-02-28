import { ReviewModel, IReview } from '../models/review.model';
import { CreateReviewDto } from '../dtos/review.dto';

export class ReviewRepository {
  async upsert(movieId: string, userId: string, dto: CreateReviewDto): Promise<IReview> {
    return ReviewModel.findOneAndUpdate(
      { movie: movieId, user: userId },
      { rating: dto.rating, comment: dto.comment },
      { upsert: true, new: true, runValidators: true }
    ).populate('user', 'fullname') as Promise<IReview>;
  }

  async findByMovie(movieId: string): Promise<IReview[]> {
    return ReviewModel.find({ movie: movieId })
      .populate('user', 'fullname')
      .sort({ createdAt: -1 });
  }

  async findUserReview(movieId: string, userId: string): Promise<IReview | null> {
    return ReviewModel.findOne({ movie: movieId, user: userId })
      .populate('user', 'fullname');
  }

  async deleteUserReview(movieId: string, userId: string): Promise<void> {
    await ReviewModel.findOneAndDelete({ movie: movieId, user: userId });
  }
}