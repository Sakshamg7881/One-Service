/**
 * OneService – AI Controller
 * Integrates OpenAI for image analysis, recommendations, chat, price negotiation, review sentiment
 */
const OpenAI = require("openai");
const Service = require("../models/Service.model");
const Vendor = require("../models/Vendor.model");
const Booking = require("../models/Booking.model");
const { Review } = require("../models/index");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── POST /api/ai/analyze-image ────────────────────────────────────────────────
// User uploads an image → AI detects problem, suggests service category + vendors
exports.analyzeImage = async (req, res, next) => {
  try {
    const { imageUrl, userLocation } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Image URL is required." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
            {
              type: "text",
              text: `You are a home services expert AI for a platform called OneService (India).
Analyze this image and respond ONLY in valid JSON with this exact structure:
{
  "problemType": "short problem title",
  "problemDescription": "detailed description of the issue",
  "severity": "low|medium|high|emergency",
  "suggestedCategory": "one of: Plumbing, Electrical, Carpentry, Painting, Cleaning, AC Repair, Appliance Repair, Pest Control, Gardening, Security",
  "immediateAction": "what the user should do right now",
  "estimatedCostRange": { "min": number, "max": number, "currency": "INR" },
  "tags": ["tag1", "tag2"]
}`,
            },
          ],
        },
      ],
      max_tokens: 600,
    });

    let analysis;
    try {
      const raw = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(raw);
    } catch {
      analysis = { raw: completion.choices[0].message.content };
    }

    // Find relevant vendors if location provided
    let suggestedVendors = [];
    if (analysis.suggestedCategory && userLocation) {
      suggestedVendors = await Vendor.find({
        status: "approved",
        categories: { $in: [analysis.suggestedCategory] },
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] },
            $maxDistance: 10000, // 10km
          },
        },
      })
        .limit(5)
        .populate("user", "name avatar")
        .select("businessName rating vendorId isVerified location categories");
    }

    res.json({ success: true, data: { analysis, suggestedVendors } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ai/recommendations ─────────────────────────────────────────────
exports.getRecommendations = async (req, res, next) => {
  try {
    const { category, userLocation, radius = 5000 } = req.body;
    const userId = req.user._id;

    // Get user's booking history for personalization
    const history = await Booking.find({ user: userId, status: "completed" })
      .populate("service", "category")
      .limit(10);

    const pastCategories = [...new Set(history.map((b) => b.service?.category).filter(Boolean))];

    // Find nearby vendors
    const geoFilter = userLocation
      ? {
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] },
              $maxDistance: radius,
            },
          },
        }
      : {};

    const categoryFilter = category ? { categories: { $in: [category] } } : {};

    const vendors = await Vendor.find({ status: "approved", ...geoFilter, ...categoryFilter })
      .limit(20)
      .populate("user", "name avatar")
      .select("businessName rating totalReviews vendorId isVerified categories location earnings");

    // Ask AI to rank/explain recommendations
    const prompt = `You are a smart service recommendation AI for OneService (India).
User's past service categories: ${pastCategories.join(", ") || "none"}.
Requested category: ${category || "any"}.

Vendors available (JSON):
${JSON.stringify(
  vendors.map((v) => ({
    id: v._id,
    name: v.businessName,
    rating: v.rating,
    reviews: v.totalReviews,
    categories: v.categories,
  }))
)}

Return a JSON array of vendor IDs sorted by best match with a brief "reason" for each:
[{ "vendorId": "...", "reason": "..." }]
Return ONLY valid JSON, no extra text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });

    let ranked = [];
    try {
      const raw = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      ranked = JSON.parse(raw);
    } catch {
      ranked = vendors.map((v) => ({ vendorId: v._id.toString(), reason: "Based on rating." }));
    }

    // Merge reasons back into vendor objects
    const vendorMap = Object.fromEntries(vendors.map((v) => [v._id.toString(), v]));
    const result = ranked
      .map((r) => ({ ...vendorMap[r.vendorId]?.toObject(), aiReason: r.reason }))
      .filter(Boolean);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
exports.aiChat = async (req, res, next) => {
  try {
    const { messages } = req.body; // Array of { role, content }

    const systemPrompt = `You are OneService AI Assistant — a helpful, friendly assistant for India's #1 home services marketplace.
You help users:
- Find the right service category for their problem
- Understand pricing (services typically range ₹200–₹5000 in India)
- Book services, track vendors, manage bookings
- Resolve disputes or issues
Always be concise, helpful, and use simple language. If a user describes a home problem, suggest the correct service category.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 500,
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content,
      usage: completion.usage,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ai/price-negotiation ───────────────────────────────────────────
exports.priceNegotiation = async (req, res, next) => {
  try {
    const { serviceId, proposedPrice, context } = req.body;

    const service = await Service.findById(serviceId).populate("vendor", "rating totalBookings");
    if (!service) return res.status(404).json({ success: false, message: "Service not found." });

    const prompt = `You are a fair pricing assistant for OneService (Indian home services marketplace).
Service: ${service.title} (Category: ${service.category})
Listed price: ₹${service.price.base} (${service.price.unit})
Vendor rating: ${service.vendor.rating}/5 with ${service.vendor.totalBookings} jobs
User proposed price: ₹${proposedPrice}
Context: ${context || "none"}

Provide fair negotiation advice in JSON:
{
  "fairRangeMin": number,
  "fairRangeMax": number,
  "recommendation": "accept|counter|reject",
  "counterOffer": number or null,
  "explanation": "short explanation (2-3 sentences)",
  "tips": ["tip1", "tip2"]
}
Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    let advice;
    try {
      const raw = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      advice = JSON.parse(raw);
    } catch {
      advice = { explanation: completion.choices[0].message.content };
    }

    res.json({ success: true, data: advice });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ai/analyze-review ───────────────────────────────────────────────
exports.analyzeReview = async (req, res, next) => {
  try {
    const { reviewText, rating } = req.body;

    const prompt = `Analyze this service review for sentiment and authenticity.
Review: "${reviewText}"
Rating given: ${rating}/5

Return JSON only:
{
  "sentimentScore": number between -1 (very negative) and 1 (very positive),
  "sentimentLabel": "positive|neutral|negative",
  "isFake": boolean,
  "fakeConfidence": number between 0 and 1,
  "flagReason": "reason if fake else empty string",
  "emotions": ["emotion1", "emotion2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    let result;
    try {
      const raw = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      result = JSON.parse(raw);
    } catch {
      result = { sentimentLabel: "neutral", isFake: false };
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
