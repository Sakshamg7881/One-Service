/**
 * OneService – AI Controller
 * Integrates OpenAI for image analysis, recommendations, chat,
 * price negotiation, and review sentiment.
 */

const OpenAI = require("openai");
const Service = require("../models/Service.model");
const Vendor = require("../models/Vendor.model");
const Booking = require("../models/Booking.model");
const { Review } = require("../models/index");

// ─────────────────────────────────────────────
// OpenAI Configuration
// ─────────────────────────────────────────────

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Helper function
const requireOpenAI = (res) => {
  if (!openai) {
    // send a single response and return false so callers can stop further processing
    res.status(503).json({
      success: false,
      message:
        "OpenAI API key is not configured. Please add OPENAI_API_KEY to the backend .env file.",
    });
    return false;
  }

  return true;
};

// ─────────────────────────────────────────────
// POST /api/ai/analyze-image
// ─────────────────────────────────────────────

exports.analyzeImage = async (req, res, next) => {
  try {
    if (!requireOpenAI(res)) return;

    const { imageUrl, userLocation } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
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
  "estimatedCostRange": {
    "min": number,
    "max": number,
    "currency": "INR"
  },
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
      const raw = completion.choices[0].message.content
        .replace(/```json|```/g, "")
        .trim();

      analysis = JSON.parse(raw);
    } catch {
      analysis = {
        raw: completion.choices[0].message.content,
      };
    }

    // Find relevant vendors if location is provided
    let suggestedVendors = [];

    if (analysis.suggestedCategory && userLocation) {
      suggestedVendors = await Vendor.find({
        status: "approved",
        categories: {
          $in: [analysis.suggestedCategory],
        },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                userLocation.lng,
                userLocation.lat,
              ],
            },
            $maxDistance: 10000,
          },
        },
      })
        .limit(5)
        .populate("user", "name avatar")
        .select(
          "businessName rating vendorId isVerified location categories"
        );
    }

    return res.json({
      success: true,
      data: {
        analysis,
        suggestedVendors,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/recommendations
// ─────────────────────────────────────────────

exports.getRecommendations = async (req, res, next) => {
  try {
    const {
      category,
      userLocation,
      radius = 5000,
    } = req.body;

    const userId = req.user._id;

    // Get user's booking history
    const history = await Booking.find({
      user: userId,
      status: "completed",
    })
      .populate("service", "category")
      .limit(10);

    const pastCategories = [
      ...new Set(
        history
          .map((booking) => booking.service?.category)
          .filter(Boolean)
      ),
    ];

    // Nearby vendor filter
    const geoFilter = userLocation
      ? {
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [
                  userLocation.lng,
                  userLocation.lat,
                ],
              },
              $maxDistance: radius,
            },
          },
        }
      : {};

    const categoryFilter = category
      ? {
          categories: {
            $in: [category],
          },
        }
      : {};

    const vendors = await Vendor.find({
      status: "approved",
      ...geoFilter,
      ...categoryFilter,
    })
      .limit(20)
      .populate("user", "name avatar")
      .select(
        "businessName rating totalReviews vendorId isVerified categories location earnings"
      );

    // If OpenAI is not configured,
    // return vendors based on rating.
    if (!openai) {
      const fallbackResult = vendors
        .sort(
          (a, b) =>
            (b.rating || 0) - (a.rating || 0)
        )
        .map((vendor) => ({
          ...vendor.toObject(),
          aiReason:
            "Recommended based on vendor rating.",
        }));

      return res.json({
        success: true,
        data: fallbackResult,
        aiEnabled: false,
      });
    }

    // AI ranking prompt
    const prompt = `You are a smart service recommendation AI for OneService (India).

User's past service categories:
${pastCategories.join(", ") || "none"}

Requested category:
${category || "any"}

Vendors available:

${JSON.stringify(
  vendors.map((vendor) => ({
    id: vendor._id,
    name: vendor.businessName,
    rating: vendor.rating,
    reviews: vendor.totalReviews,
    categories: vendor.categories,
  }))
)}

Return a JSON array of vendor IDs sorted by best match with a brief reason for each:

[
  {
    "vendorId": "...",
    "reason": "..."
  }
]

Return ONLY valid JSON, no extra text.`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
      });

    let ranked = [];

    try {
      const raw = completion.choices[0].message.content
        .replace(/```json|```/g, "")
        .trim();

      ranked = JSON.parse(raw);
    } catch {
      ranked = vendors.map((vendor) => ({
        vendorId: vendor._id.toString(),
        reason: "Based on vendor rating.",
      }));
    }

    // Merge AI reasons with vendors
    const vendorMap = Object.fromEntries(
      vendors.map((vendor) => [
        vendor._id.toString(),
        vendor,
      ])
    );

    const result = ranked
      .map((item) => {
        const vendor = vendorMap[item.vendorId];

        if (!vendor) {
          return null;
        }

        return {
          ...vendor.toObject(),
          aiReason: item.reason,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data: result,
      aiEnabled: true,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────

exports.aiChat = async (req, res, next) => {
  try {
    if (!requireOpenAI(res)) return;

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "messages must be an array.",
      });
    }

    const systemPrompt = `You are OneService AI Assistant — a helpful, friendly assistant for India's home services marketplace.

You help users:

- Find the right service category for their problem
- Understand pricing
- Book services
- Track vendors
- Manage bookings
- Resolve disputes or issues

Always be concise, helpful, and use simple language.

If a user describes a home problem, suggest the correct service category.`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        max_tokens: 500,
      });

    return res.json({
      success: true,
      reply:
        completion.choices[0].message.content,
      usage: completion.usage,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/price-negotiation
// ─────────────────────────────────────────────

exports.priceNegotiation = async (
  req,
  res,
  next
) => {
  try {
    if (!requireOpenAI(res)) return;

    const {
      serviceId,
      proposedPrice,
      context,
    } = req.body;

    const service = await Service.findById(
      serviceId
    ).populate(
      "vendor",
      "rating totalBookings"
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (!service.vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor information not found.",
      });
    }

    const prompt = `You are a fair pricing assistant for OneService (Indian home services marketplace).

Service:
${service.title}

Category:
${service.category}

Listed price:
₹${service.price.base} (${service.price.unit})

Vendor rating:
${service.vendor.rating}/5

Vendor total bookings:
${service.vendor.totalBookings}

User proposed price:
₹${proposedPrice}

Context:
${context || "none"}

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

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
      });

    let advice;

    try {
      const raw = completion.choices[0].message.content
        .replace(/```json|```/g, "")
        .trim();

      advice = JSON.parse(raw);
    } catch {
      advice = {
        explanation:
          completion.choices[0].message.content,
      };
    }

    return res.json({
      success: true,
      data: advice,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/analyze-review
// ─────────────────────────────────────────────

exports.analyzeReview = async (
  req,
  res,
  next
) => {
  try {
    if (!requireOpenAI(res)) return;

    const {
      reviewText,
      rating,
    } = req.body;

    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message: "Review text is required.",
      });
    }

    const prompt = `Analyze this service review for sentiment and authenticity.

Review:
"${reviewText}"

Rating given:
${rating}/5

Return JSON only:

{
  "sentimentScore": number between -1 (very negative) and 1 (very positive),
  "sentimentLabel": "positive|neutral|negative",
  "isFake": boolean,
  "fakeConfidence": number between 0 and 1,
  "flagReason": "reason if fake else empty string",
  "emotions": ["emotion1", "emotion2"]
}`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
      });

    let result;

    try {
      const raw = completion.choices[0].message.content
        .replace(/```json|```/g, "")
        .trim();

      result = JSON.parse(raw);
    } catch {
      result = {
        sentimentLabel: "neutral",
        isFake: false,
      };
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};