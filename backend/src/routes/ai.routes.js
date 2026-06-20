/**
 * OneService – AI Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const aiController = require("../controllers/ai.controller");

router.post("/analyze-image", protect, aiController.analyzeImage);
router.post("/recommendations", protect, aiController.getRecommendations);
router.post("/chat", protect, aiController.aiChat);
router.post("/price-negotiation", protect, aiController.priceNegotiation);
router.post("/analyze-review", aiController.analyzeReview); // called internally too

module.exports = router;
