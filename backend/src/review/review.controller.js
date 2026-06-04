import * as reviewService from './review.service.js';

export const createReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, body } = req.body;
        const userId = req.user.userId;

        if (rating === undefined || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const review = await reviewService.createReview(userId, courseId, rating, body || "");
        res.status(201).json({ message: "Review added successfully", review });
    } catch (error) {
        if (error.message.includes("enrolled") || error.message.includes("already")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;
        const reviews = await reviewService.getCourseReviews(courseId);
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const review = await reviewService.updateReview(userId, id, req.body);
        res.status(200).json({ message: "Review updated successfully", review });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await reviewService.deleteReview(userId, id);
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};
