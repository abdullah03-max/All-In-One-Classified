import { Category } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const aiService = {
  async callGroq(prompt: string, fallback: string): Promise<string> {
    if (!GROQ_API_KEY) {
      // Simulate delay for modern experience
      await new Promise(resolve => setTimeout(resolve, 800));
      return fallback;
    }
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
      return fallback;
    } catch (e) {
      console.error('Groq AI call failed, using high-quality fallback:', e);
      return fallback;
    }
  },

  async generateDescription(title: string, categoryName: string, attributes: Record<string, string>): Promise<string> {
    const attrStr = Object.entries(attributes || {})
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `- ${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
      .join('\n');
    
    const prompt = `Write a premium, highly detailed, attractive, and professional marketplace listing description for a product.
Title: ${title}
Category: ${categoryName}
Attributes:
${attrStr}

Create clear sections with bullet points for key features, tell a nice story about the item, describe its condition, and keep the formatting professional and clean. Do not include phone numbers or standard email signatures. Output ONLY the description text.`;

    const fallback = `✨ **Premium Listing: ${title}** ✨

I am selling this highly-maintained item in **${attributes.condition || 'Good'}** condition. It has been used with care and is fully functional.

### Key Specifications:
${Object.entries(attributes || {})
  .filter(([_, v]) => v !== undefined && v !== '')
  .map(([k, v]) => `* **${k.replace(/_/g, ' ').toUpperCase()}**: ${v}`)
  .join('\n')}

### Product Features:
* 100% original and authentic.
* Handled with extreme care.
* Excellent choice for those seeking quality and value.
* Price is slightly negotiable for serious buyers.

*Feel free to reach out to ask any questions or schedule an inspection.*`;

    return this.callGroq(prompt, fallback);
  },

  async suggestTitles(titleDraft: string, categoryName: string): Promise<string[]> {
    const prompt = `Give me 3 short, catchy, and professional marketplace title suggestions based on this initial draft: "${titleDraft}" in the "${categoryName}" category. Respond with ONLY a JSON array of strings, for example: ["Title 1", "Title 2", "Title 3"].`;
    
    const fallback = [
      `${titleDraft} - Excellent Condition`,
      `Premium ${titleDraft} (Highly Maintained)`,
      `Sleek ${titleDraft} - Best Offer`
    ];

    if (!GROQ_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return fallback;
    }

    try {
      const res = await this.callGroq(prompt, JSON.stringify(fallback));
      const match = res.match(/\[.*\]/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return fallback;
    } catch {
      return fallback;
    }
  },

  async suggestCategory(title: string, categories: Category[]): Promise<string | null> {
    const titleLower = title.toLowerCase();
    
    // Find matching categories recursively
    for (const cat of categories) {
      if (titleLower.includes(cat.name.toLowerCase()) || cat.slug.split('-').some(s => s.length > 3 && titleLower.includes(s))) {
        return cat.subcategories && cat.subcategories.length > 0 ? cat.subcategories[0].id : cat.id;
      }
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          if (titleLower.includes(sub.name.toLowerCase()) || sub.slug.split('-').some(s => s.length > 3 && titleLower.includes(s))) {
            return sub.id;
          }
        }
      }
    }
    return null;
  },

  async suggestPrice(title: string, categoryName: string, attributes: Record<string, string>): Promise<{ min: number; max: number; suggested: number }> {
    let basePrice = 25000;
    const titleLower = title.toLowerCase();
    const catNameLower = categoryName.toLowerCase();
    
    if (catNameLower.includes('phone') || titleLower.includes('iphone') || titleLower.includes('galaxy') || titleLower.includes('mobile')) {
      basePrice = 85000;
      if (titleLower.includes('15') || titleLower.includes('14') || titleLower.includes('ultra') || titleLower.includes('pro')) {
        basePrice = 180000;
      }
    } else if (catNameLower.includes('car') || titleLower.includes('honda') || titleLower.includes('toyota') || titleLower.includes('suzuki') || titleLower.includes('vehicle')) {
      basePrice = 2800000;
      if (titleLower.includes('civic') || titleLower.includes('corolla') || titleLower.includes('fortuner')) {
        basePrice = 5500000;
      }
    } else if (catNameLower.includes('property') || catNameLower.includes('house') || catNameLower.includes('apartment')) {
      basePrice = 15000000;
    }

    // Adjust price by condition
    const condition = (attributes.condition || '').toLowerCase();
    if (condition === 'new') basePrice *= 1.1;
    else if (condition === 'good') basePrice *= 0.95;
    else if (condition === 'fair') basePrice *= 0.8;
    else if (condition === 'poor') basePrice *= 0.6;

    return {
      min: Math.round(basePrice * 0.9),
      max: Math.round(basePrice * 1.1),
      suggested: Math.round(basePrice)
    };
  },

  async detectSpam(title: string, description: string, price: number): Promise<{ isSpam: boolean; reason?: string }> {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();

    // Check for obvious scam words
    const scamKeywords = ['win money', 'get rich quick', 'earn 5000 daily', 'investment plan', 'double money', 'cash giveaway', 'free gift card'];
    for (const kw of scamKeywords) {
      if (titleLower.includes(kw) || descLower.includes(kw)) {
        return { isSpam: true, reason: `Listing contains suspicious marketing keyword: "${kw}"` };
      }
    }

    if (price <= 10 && price > 0) {
      return { isSpam: true, reason: 'The price is suspiciously low. Please specify a realistic price.' };
    }

    if (title.length < 5) {
      return { isSpam: true, reason: 'Title is too short. It must be at least 5 characters.' };
    }

    if (description.length < 15) {
      return { isSpam: true, reason: 'Description is too short. Please add more details about the item.' };
    }

    if (GROQ_API_KEY) {
      const prompt = `Act as an automated spam & scam detector for a local classifieds marketplace. Analyze this ad:
Title: ${title}
Description: ${description}
Price: ${price} PKR

Determine if this is spam, a commercial scam, fake advertising, or duplicate keyword stuffing. Respond with ONLY a JSON object: {"isSpam": true/false, "reason": "explanation of spam"}.`;
      try {
        const res = await this.callGroq(prompt, '{"isSpam": false}');
        const match = res.match(/\{.*\}/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return parsed;
        }
      } catch (e) {
        console.error('Groq spam check failed:', e);
      }
    }

    return { isSpam: false };
  }
};
