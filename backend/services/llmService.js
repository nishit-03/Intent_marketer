const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Extract structured features from ad title and description using Groq LLaMA
 */
async function extractAdFeatures(title, description) {
  try {
    const prompt = `You are an advertising intelligence system. Analyze the following ad and extract structured metadata.

Ad Title: "${title}"
Ad Description: "${description}"

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "product": "the main product or service being advertised",
  "category": "one of: tech, finance, travel, health, education, ecommerce, other",
  "brand": "brand name if identifiable, or empty string",
  "price_range": "one of: budget, mid_range, premium, luxury, or empty string",
  "attributes": ["list", "of", "key", "product", "attributes"],
  "target_intent": "one of: browsing, exploring, comparing, buying",
  "keywords": ["relevant", "search", "keywords", "for", "matching"],
  "summary": "one sentence summary of what this ad offers"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error('Empty response from Groq');

    const features = JSON.parse(responseText);

    // Validate and sanitize
    return {
      product: features.product || '',
      category: features.category || 'other',
      brand: features.brand || '',
      price_range: features.price_range || '',
      attributes: Array.isArray(features.attributes) ? features.attributes : [],
      target_intent: features.target_intent || 'browsing',
      keywords: Array.isArray(features.keywords) ? features.keywords : [],
      summary: features.summary || '',
    };
  } catch (error) {
    console.error('LLM extraction failed, using fallback:', error.message);
    return fallbackExtract(title, description);
  }
}

/**
 * Rule-based fallback extractor when LLM is unavailable
 */
function fallbackExtract(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const categoryMap = {
    tech: ['laptop', 'phone', 'software', 'app', 'computer', 'gaming', 'ai', 'cloud', 'devops', 'code', 'developer', 'saas', 'api', 'data', 'cyber', 'digital', 'tech', 'gadget', 'smart', 'wireless'],
    finance: ['invest', 'bank', 'loan', 'credit', 'insurance', 'trading', 'stock', 'crypto', 'money', 'fund', 'saving', 'fintech', 'payment', 'wallet', 'tax', 'budget'],
    travel: ['travel', 'flight', 'hotel', 'booking', 'vacation', 'trip', 'tour', 'destination', 'resort', 'cruise', 'airline', 'backpack', 'adventure'],
    health: ['health', 'fitness', 'wellness', 'doctor', 'medical', 'supplement', 'vitamin', 'workout', 'diet', 'nutrition', 'mental', 'yoga', 'organic'],
    education: ['course', 'learn', 'education', 'training', 'certification', 'tutorial', 'study', 'university', 'degree', 'skill', 'bootcamp', 'online class'],
    ecommerce: ['shop', 'buy', 'deal', 'discount', 'sale', 'offer', 'price', 'delivery', 'order', 'store', 'marketplace', 'product'],
  };

  let detectedCategory = 'other';
  let maxScore = 0;
  for (const [cat, words] of Object.entries(categoryMap)) {
    const score = words.filter(w => text.includes(w)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat;
    }
  }

  const intentSignals = {
    buying: ['buy', 'order', 'purchase', 'get', 'subscribe', 'sign up', 'start', 'try free', 'get started'],
    comparing: ['compare', 'vs', 'versus', 'best', 'top', 'review', 'alternative'],
    exploring: ['discover', 'explore', 'learn', 'find out', 'how to', 'guide'],
    browsing: ['info', 'about', 'what is', 'introduction', 'overview'],
  };

  let detectedIntent = 'browsing';
  for (const [intent, signals] of Object.entries(intentSignals)) {
    if (signals.some(s => text.includes(s))) {
      detectedIntent = intent;
      break;
    }
  }

  // Extract keywords: meaningful words > 3 chars, deduplicated
  const stopWords = new Set(['the', 'and', 'for', 'with', 'your', 'that', 'this', 'from', 'have', 'will', 'been', 'more', 'most', 'also', 'just', 'than', 'them', 'into', 'only', 'very', 'when', 'what', 'about']);
  const keywords = [...new Set(
    text.split(/\W+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 10)
  )];

  return {
    product: title.split(/[-–|:]/)[0].trim(),
    category: detectedCategory,
    brand: '',
    price_range: '',
    attributes: keywords.slice(0, 5),
    target_intent: detectedIntent,
    keywords,
    summary: description.substring(0, 100),
  };
}

module.exports = { extractAdFeatures, fallbackExtract };
