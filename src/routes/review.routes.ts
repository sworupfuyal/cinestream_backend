import { Router } from 'express';
import { ReviewController } from '../controller/review.controller';
import {  authorizedMiddleware } from '../middlewares/authorized.middleware';

const router = Router();
const controller = new ReviewController();

router.get('/:movieId',    authorizedMiddleware, (req, res) => controller.getReviews(req, res));
router.post('/:movieId',   authorizedMiddleware, (req, res) => controller.upsertReview(req, res));
router.delete('/:movieId', authorizedMiddleware, (req, res) => controller.deleteReview(req, res));

export default router;