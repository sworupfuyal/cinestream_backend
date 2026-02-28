import { Request, Response } from 'express';
import { ReviewRepository } from '../repositories/review.repository';
import { CreateReviewDto } from '../dtos/review.dto';

const repo = new ReviewRepository();

export class ReviewController {
  // GET /api/reviews/:movieId
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      const reviews = await repo.findByMovie(movieId);

      const averageRating = reviews.length
        ? parseFloat(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          )
        : 0;

      // Flag which review belongs to the requesting user
      const mapped = reviews.map((r) => ({
        id:        r._id,
        rating:    r.rating,
        comment:   r.comment,
        createdAt: r.createdAt,
        isOwn:     r.user._id.toString() === userId,
        user: {
          id:       (r.user as any)._id,
          fullname: (r.user as any).fullname,
        },
      }));

      res.status(200).json({
        success: true,
        message: 'Reviews fetched successfully',
        data: {
          averageRating,
          totalReviews: reviews.length,
          reviews: mapped,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/reviews/:movieId
  async upsertReview(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;
      const dto: CreateReviewDto = req.body;

      if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
        res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        return;
      }

      const review = await repo.upsert(movieId, userId, dto);

      res.status(200).json({
        success: true,
        message: 'Review saved successfully',
        data: review,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/reviews/:movieId
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      await repo.deleteUserReview(movieId, userId);

      res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}