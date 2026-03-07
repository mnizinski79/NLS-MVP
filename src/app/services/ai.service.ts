import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { AIResponse, ConversationState, SearchCriteria } from '../models';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private readonly TIMEOUT_MS = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Process user query with Google Gemini AI
   * Implements timeout, retry logic, and fallback processing on failure
   * @param query - User's natural language query
   * @param conversationState - Current conversation context and state
   * @returns Observable of AIResponse with intent, message, and search criteria
   */
  processQuery(query: string, conversationState: ConversationState): Observable<AIResponse> {
    console.log('🤖 AI processQuery called with state:', {
      focusedHotel: conversationState.focusedHotel?.name || 'null',
      lastDisplayedHotelsCount: conversationState.lastDisplayedHotels?.length || 0
    });
    
    const apiKey = this.configService.getApiKey();
    
    if (!apiKey) {
      this.logError('AI API Error', new Error('API key not available'), query);
      return of(this.fallbackProcessing(query));
    }

    const prompt = this.buildPrompt(query, conversationState);
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const url = `${this.GEMINI_API_URL}?key=${apiKey}`;

    return this.http.post(url, payload, { headers }).pipe(
      timeout(this.TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} after error:`, error);
          return timer(1000 * retryCount);
        }
      }),
      map(response => this.parseResponse(response, query)),
      catchError(error => {
        this.logError('AI API Error', error, query);
        return of(this.fallbackProcessing(query));
      })
    );
  }

  /**
   * Build AI prompt with conversation context and state
   * Includes system instructions, context, last displayed hotels, and expected JSON format
   * @param query - User's query to process
   * @param state - Current conversation state with context
   * @returns Formatted prompt string for Gemini API
   */
  /**
     * Build AI prompt with conversation context and state
     * Includes system instructions, context, last displayed hotels, and expected JSON format
     * @param query - User's query to process
     * @param state - Current conversation state with context
     * @returns Formatted prompt string for Gemini API
     */
    buildPrompt(query: string, state: ConversationState): string {
      const contextInfo: string[] = [];

      // Add conversation context
      if (state.lastQuery) {
        contextInfo.push(`Previous query: ${state.lastQuery}`);
      }

      if (state.conversationContext.location) {
        contextInfo.push(`Location confirmed: ${state.conversationContext.location}`);
      }

      if (state.conversationContext.guestCount) {
        contextInfo.push(`Guest count: ${state.conversationContext.guestCount} adults`);
      }

      if (state.lastIntent) {
        contextInfo.push(`Last intent: ${state.lastIntent}`);
      }

      // Add information about currently focused hotel (detail view open)
      if (state.focusedHotel) {
        console.log('🎯 Building prompt with focused hotel:', state.focusedHotel.name);
        contextInfo.push(`\n**CURRENTLY VIEWING HOTEL DETAILS:**`);
        contextInfo.push(`Hotel: ${state.focusedHotel.name}`);
        contextInfo.push(`Brand: ${state.focusedHotel.brand}`);
        contextInfo.push(`Location: ${state.focusedHotel.location.address}, ${state.focusedHotel.location.neighborhood}`);
        contextInfo.push(`Price: $${state.focusedHotel.pricing.nightlyRate}/night`);
        contextInfo.push(`Rating: ${state.focusedHotel.rating}/5`);
        contextInfo.push(`Description: ${state.focusedHotel.description}`);
        contextInfo.push(`Amenities: ${state.focusedHotel.amenities.join(', ')}`);
        contextInfo.push(`\nIMPORTANT: When user says "this hotel", "it", "here", or similar references, they are referring to ${state.focusedHotel.name}.`);
      } else {
        console.log('⚠️ No focused hotel in state');
      }

      // Add information about currently displayed hotels
      if (state.lastDisplayedHotels && state.lastDisplayedHotels.length > 0) {
        contextInfo.push(`\nCurrently displayed hotels (${state.lastDisplayedHotels.length}):`);
        state.lastDisplayedHotels.forEach((hotel, index) => {
          contextInfo.push(`${index + 1}. ${hotel.name} - $${hotel.pricing.nightlyRate}/night at ${hotel.location}`);
          contextInfo.push(`   Description: ${hotel.description || 'N/A'}`);
          contextInfo.push(`   Amenities: ${hotel.amenities?.join(', ') || 'N/A'}`);
          contextInfo.push(`   Rating: ${hotel.rating || 'N/A'}, Brand: ${hotel.brand}`);
        });
      }

      const context = contextInfo.length > 0 
        ? `\n\nConversation Context:\n${contextInfo.join('\n')}` 
        : '';

      return `You are a warm and knowledgeable hotel search assistant — like a well-traveled professional who genuinely wants to help you find the perfect stay in New York City.

---

CORE PERSONALITY:
- Warm, conversational, and genuinely helpful — never robotic or clipped
- You celebrate good choices, offer real insight, and guide users naturally
- You feel like a local expert, not a search engine
- Keep it human: contractions, natural phrasing, light enthusiasm

---

MARKDOWN FORMATTING — REQUIRED:
- **ALWAYS use bold** for key features, amenities, locations, and important details
- **ALWAYS use line breaks** (\\n\\n) between distinct thoughts or sections
- **Use bullet points** (- ) when listing 2+ items or features
- **Structure responses** with clear visual hierarchy
- Example: "Found 3 great options!\\n\\n**Key features:**\\n- Rooftop bars with city views\\n- Pet-friendly policies\\n- Walking distance to Central Park"
- IMPORTANT: In JSON, use \\n for newlines (escaped backslash-n), not literal line breaks

---

RESPONSE LENGTH — BRIEF & SCANNABLE:
- **Maximum 3 sentences** for simple queries (e.g., "show me hotels")
- **Maximum 4 sentences** for complex queries (e.g., "rooftop bar near Broadway with parking")
- **Always end with ONE action item** (question, offer to refine, or next step)
- **Use formatting to replace length** — bullets and bold instead of long paragraphs
- **Never repeat information** — if it's in the cards, don't say it in text

---

AFTER SHOWING RESULTS — ALWAYS DO ONE OF THESE:
1. Highlight a standout amenity across the results ("A few of these have rooftop bars worth knowing about — want me to filter just those?")
2. Offer to narrow/refine ("I can filter by price, vibe, or amenities if you want something more specific.")
3. Ask about dates/budget if not yet provided ("Do you have dates in mind? That'll help me check availability and show you real pricing.")

You must always end with one of the above — never leave the user at a dead end.

---

CONTEXTUAL ANCHORING PRINCIPLES:
1. Acknowledge & Validate — never say "I can't do that"
2. Anchor to Location — every result needs geography context
3. Bridge & Steer — pivot unsupported requests to the closest supported attribute
4. Surface results fast — don't hold results hostage behind clarifying questions
5. Answer questions about displayed hotels using their actual details from context

---

AFFIRMATION VARIETY — Never use the same opener twice in a row. Rotate through:
"On it!", "Let's see what we've got!", "Great choice!", "Love that!", "Sure thing!", "Consider it done!", "You got it!", "Here we go!", "Perfect, let me pull those up!", "Absolutely!", "Sounds good!", "Coming right up!", "Let's do this!"

---

SHOW ALL OVERRIDE — If user says any of these, return ALL hotels with NO filters:
- "show me all hotels" / "show me everything" / "remove filters" / "show all" / "clear filters" / "just show me all of them"

Response: Brief confirmation only. e.g. "Here's everything we've got in New York — [X] hotels across all neighborhoods!" Then offer ONE refinement nudge.

---

TRIGGER PHRASES — Surface results immediately:
- "show me hotels", "just show me", "I'm not sure, just show me", any "show me" variation

---

RESPONSE FORMATTING RULES:
- NEVER list hotel names in your response text — the cards show the names
- NEVER say "Hotel A and Hotel B both have one"
- Use singular "hotel" for 1 result, plural for multiple
- Always mention the specific attribute or vibe that drove the selection
- When ≤3 results: DO NOT prompt for dates — the UI date picker handles this automatically

---

GOOD RESPONSE EXAMPLES:
Simple: "Here are 6 hotels near Times Square! A couple of these have rooftop bars with great city views — want me to filter just those, or do you have a budget in mind?"

Specific: "Found 4 pet-friendly hotels in Midtown — these are all well-rated and close to Central Park, which is great for walks. Want to narrow by price or check availability for specific dates?"

Vague: "New York's got a lot going on! Are you leaning toward somewhere central like Midtown or Times Square, or something with more character like SoHo or Chelsea? I can pull up options either way."

---

DATE & GUEST COUNT:
- When returning ≤3 results, DO NOT include date prompts — the UI handles this
- For ≥4 results, it's natural to ask about dates as your ONE follow-up
- Never stack date AND guest count questions — one ask per response max

Current query: "${query}"${context}

  Available attributes:
  - Locations: Times Square, Midtown, Broadway, Theater District, Financial District, Chelsea, SoHo
  - Amenities: Rooftop Bar, Fitness Center, Pet Friendly, Free Wi-Fi, Pool, Spa, Restaurant, Room Service, Concierge
  - Brands: Kimpton, voco, InterContinental, Holiday Inn, Independent
  - Price ranges: Budget (<$200), Mid-range ($200-400), Luxury (>$400)

  BUDGET FALLBACK RULE:
  - When user specifies a budget (e.g., "around $150/night", "under $200"), be generous with the interpretation
  - If the exact budget would return 0 results, widen the priceRange.max by 20-30% to show the closest affordable options
  - Example: "budget around $150" → set priceRange.max to 200 (not 150) to show near-budget options
  - In your message, acknowledge the budget and explain you're showing the closest options: "I found a couple of options close to your $150 budget"

  CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do NOT include any conversational text. Do NOT include explanations. Start your response with { and end with }. Your entire response must be parseable JSON.

  MESSAGE FORMATTING REQUIREMENTS:
  - Use **bold** for ALL key terms (amenities, locations, brands, features)
  - Use \\n\\n for line breaks between thoughts (escaped in JSON as "\\n\\n")
  - Use bullet points (- ) when listing 2+ items
  - Keep total message under 4 sentences
  - Structure: [Affirmation + key info] + [Formatted details if needed] + [One action item]
  - Example message field in JSON: "Here are 4 hotels in **Midtown**!\\n\\n**Standout features:**\\n- Rooftop bars\\n- Pet-friendly\\n\\nWant to filter by price?"
  - CRITICAL: Properly escape all special characters in JSON strings (quotes, backslashes, newlines)

  DATE EXTRACTION:
  - Extract check-in and check-out dates from the user's query
  - Support specific dates: "March 15", "3/15/2026", "checking in March 15 and checking out March 18"
  - Support relative dates with these rules:
    * "this weekend" = the closest upcoming weekend (Friday-Sunday)
      - If today is Mon-Thu: this weekend = the upcoming Fri-Sun of this week
      - If today is Fri-Sun: this weekend = today through Sunday
    * "next weekend" = the weekend AFTER "this weekend" (always 7+ days away if said Mon-Thu)
    * "tomorrow" = the day after today
    * "next Friday" = the next occurrence of Friday
  - Weekend check-in/check-out: Friday check-in, Sunday check-out
  - Convert all dates to ISO format (YYYY-MM-DD)
  - Current date for reference: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})
  - If dates are mentioned, include them in checkIn and checkOut fields
  - If no dates mentioned, leave checkIn and checkOut as null

  GUEST COUNT EXTRACTION:
  - Extract the total number of adults from the user's query
  - Examples:
    * "going with 3 friends" = 4 adults (user + 3 friends)
    * "for 2 people" = 2 adults
    * "me and my partner" = 2 adults
    * "family of 4" = 4 adults
    * "just me" or "solo" = 1 adult
    * "group of 6" = 6 adults
  - Always count the user as 1 person when they say "with X friends/people"
  - If no guest count mentioned, leave guestCount as null
  - Only count adults (ignore children/kids mentions for now)

  Return ONLY this JSON structure (no other text):
  {
    "intent": "location_only|preferences_only|complete_query|vague|unsupported|show_results_now|show_all|cheapest|most_expensive|hotel_info|refine_search",
    "message": "BRIEF (max 4 sentences) + FORMATTED (use **bold**, \\n\\n line breaks, - bullets) + VARIED AFFIRMATIONS + NO DATE PROMPTS + ONE ACTION ITEM",
    "searchCriteria": {
      "brands": ["array"],
      "sentiments": ["array"],
      "amenities": ["array"],
      "priceRange": {"min": number, "max": number} or null,
      "minRating": number or null,
      "sortBy": "price_asc|price_desc|rating_desc|null"
    },
    "shouldSearch": true|false,
    "shouldRefine": true|false,
    "specificHotelId": "optional-hotel-id",
    "checkIn": "YYYY-MM-DD or null",
    "checkOut": "YYYY-MM-DD or null",
    "guestCount": number or null
  }


  SPECIAL INTENTS:
  - "show_all": User wants to see all hotels without filters - set shouldSearch to true, shouldRefine to false, with empty criteria
  - "cheapest": User asks for cheapest/most affordable option
    * If asking about CURRENTLY DISPLAYED hotels (e.g., "which one is cheapest"): set shouldRefine to true, shouldSearch to false, intent to "cheapest", sortBy to "price_asc"
    * If starting fresh (e.g., "show me the cheapest hotel"): set shouldSearch to true, shouldRefine to false, sortBy "price_asc"
    * MESSAGE: Use plural "options" and mention sorting, e.g., "Here are the most affordable options, sorted by lowest price first." or "Here are your options sorted by price, lowest first."
  - "most_expensive": User asks for most expensive/luxury option
    * If asking about CURRENTLY DISPLAYED hotels (e.g., "which one is most expensive"): set shouldRefine to true, shouldSearch to false, intent to "most_expensive", sortBy to "price_desc"
    * If starting fresh (e.g., "show me the most expensive hotel"): set shouldSearch to true, shouldRefine to false, sortBy "price_desc"
    * MESSAGE: Use plural "options" and mention sorting, e.g., "Here are the most luxurious options, sorted by highest price first." or "Here are your options sorted by price, highest first."
  - "hotel_info": User asks for more information about displayed hotels - answer using hotel details from context, set shouldSearch to false, shouldRefine to false
  - "refine_search": User wants to narrow down displayed results - set shouldRefine to true, shouldSearch to false
  
  CRITICAL REFINEMENT RULES:
  - If user asks "which one" or "which ones" or "what about" when hotels are already displayed, set shouldRefine to true, shouldSearch to false
  - If user adds new criteria to existing results (e.g., "which ones have a rooftop bar"), set shouldRefine to true, shouldSearch to false
  - If user asks for cheapest/most expensive "of these" or "with X amenity" when hotels are displayed, set shouldRefine to true, shouldSearch to false, and include the amenity in searchCriteria
  - shouldRefine means filter the CURRENTLY DISPLAYED hotels, not all hotels
  - NEVER set both shouldSearch and shouldRefine to true - they are mutually exclusive`;
    }

  /**
   * Parse and validate JSON response from Gemini API
   * Validates intent, criteria, and enforces 4-sentence maximum
   * @param apiResponse - Raw API response object from Gemini
   * @param query - Original user query (for error logging)
   * @returns Parsed and validated AIResponse object
   */
  /**
     * Parse JSON response from Gemini API
     * Validates intent and criteria
     */
    parseResponse(apiResponse: any, query: string): AIResponse {
      try {
        // Extract text from Gemini response structure
        const responseText = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          throw new Error('No response text from API');
        }

        // Clean up response text - remove markdown code blocks if present
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        // Parse JSON
        const parsed = JSON.parse(cleanedText);

        // Validate response structure
        const validation = this.validateAIResponse(parsed);
        if (!validation.valid) {
          console.error('AI response validation failed:', validation.errors);
          throw new Error(`Invalid response structure: ${validation.errors.join(', ')}`);
        }

        // Validate and enforce sentence count (max 4 sentences)
        const sentenceCount = this.countSentences(parsed.message);
        if (sentenceCount > 4) {
          console.warn(`AI response exceeds 4 sentences (${sentenceCount}), truncating...`);
          parsed.message = this.truncateToSentences(parsed.message, 4);
        }

        return {
          intent: parsed.intent,
          message: parsed.message,
          searchCriteria: parsed.searchCriteria,
          shouldSearch: parsed.shouldSearch,
          shouldRefine: parsed.shouldRefine,
          specificHotelId: parsed.specificHotelId,
          checkIn: parsed.checkIn,
          checkOut: parsed.checkOut,
          guestCount: parsed.guestCount
        };

      } catch (error) {
        this.logError('JSON Parse Error', error as Error, query);
        return this.fallbackProcessing(query);
      }
    }

  /**
   * Fallback keyword-based processing when AI fails
   * Extracts keywords for location, brand, amenities, and price from query
   * @param query - User's query to process
   * @returns AIResponse with extracted criteria and generic message
   */
  fallbackProcessing(query: string): AIResponse {
    const lowerQuery = query.toLowerCase();
    const criteria: SearchCriteria = {};

    // Extract location/sentiment keywords
    const locationKeywords = ['times square', 'midtown', 'broadway', 'financial district', 'chelsea', 'soho', 'tribeca', 'upper east side', 'upper west side'];
    const foundLocations = locationKeywords.filter(loc => lowerQuery.includes(loc));
    if (foundLocations.length > 0) {
      criteria.sentiments = foundLocations.map(loc => 
        loc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      );
    }

    // Extract brand keywords
    const brandKeywords = ['kimpton', 'voco', 'intercontinental', 'holiday inn', 'independent'];
    const foundBrands = brandKeywords.filter(brand => lowerQuery.includes(brand));
    if (foundBrands.length > 0) {
      criteria.brands = foundBrands.map(brand => {
        if (brand === 'kimpton') return 'Kimpton';
        if (brand === 'voco') return 'voco';
        if (brand === 'intercontinental') return 'InterContinental';
        if (brand === 'holiday inn') return 'Holiday Inn';
        if (brand === 'independent') return 'Independent';
        return brand;
      });
    }

    // Extract amenity keywords
    const amenityKeywords = [
      { keyword: 'rooftop', amenity: 'Rooftop Bar' },
      { keyword: 'bar', amenity: 'Rooftop Bar' },
      { keyword: 'gym', amenity: 'Fitness Center' },
      { keyword: 'fitness', amenity: 'Fitness Center' },
      { keyword: 'pet', amenity: 'Pet Friendly' },
      { keyword: 'pool', amenity: 'Pool' },
      { keyword: 'spa', amenity: 'Spa' },
      { keyword: 'restaurant', amenity: 'Restaurant' },
      { keyword: 'wifi', amenity: 'Free WiFi' },
      { keyword: 'parking', amenity: 'Parking' }
    ];
    
    const foundAmenities = amenityKeywords
      .filter(item => lowerQuery.includes(item.keyword))
      .map(item => item.amenity);
    
    if (foundAmenities.length > 0) {
      criteria.amenities = [...new Set(foundAmenities)]; // Remove duplicates
    }

    // Extract price keywords
    if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
      criteria.priceRange = { max: 200 };
    } else if (lowerQuery.includes('expensive') || lowerQuery.includes('luxury') || lowerQuery.includes('upscale')) {
      criteria.priceRange = { min: 400 };
    } else if (lowerQuery.includes('moderate') || lowerQuery.includes('mid-range')) {
      criteria.priceRange = { min: 200, max: 400 };
    }

    // Extract price numbers (e.g., "under $300", "less than 250")
    const priceMatch = lowerQuery.match(/(?:under|less than|below|max)\s*\$?(\d+)/);
    if (priceMatch) {
      criteria.priceRange = { max: parseInt(priceMatch[1]) };
    }
    const minPriceMatch = lowerQuery.match(/(?:over|more than|above|min)\s*\$?(\d+)/);
    if (minPriceMatch) {
      criteria.priceRange = { ...criteria.priceRange, min: parseInt(minPriceMatch[1]) };
    }

    // Extract rating
    const ratingMatch = lowerQuery.match(/(\d+)\s*star/);
    if (ratingMatch) {
      criteria.minRating = parseInt(ratingMatch[1]);
    }

    // Determine intent
    let intent: AIResponse['intent'] = 'complete_query';
    let shouldSearch = true;
    let shouldRefine = false;

    if (lowerQuery.includes('show all') || lowerQuery.includes('see all')) {
      intent = 'show_all';
    } else if (lowerQuery.includes('cheapest') || lowerQuery.includes('lowest price')) {
      intent = 'cheapest';
      criteria.sortBy = 'price_asc';
    } else if (lowerQuery.includes('most expensive') || lowerQuery.includes('highest price')) {
      intent = 'most_expensive';
      criteria.sortBy = 'price_desc';
    } else if (lowerQuery.includes('refine') || lowerQuery.includes('narrow') || lowerQuery.includes('filter')) {
      intent = 'refine_search';
      shouldRefine = true;
    }

    // Generate generic message
    const message = this.generateFallbackMessage(intent, criteria);

    return {
      intent,
      message,
      searchCriteria: Object.keys(criteria).length > 0 ? criteria : undefined,
      shouldSearch,
      shouldRefine,
    };
  }

  /**
   * Generate generic fallback message based on intent and extracted criteria
   * @param intent - Determined intent type
   * @param criteria - Extracted search criteria
   * @returns User-friendly message string
   */
  private generateFallbackMessage(intent: AIResponse['intent'], criteria: SearchCriteria): string {
    if (intent === 'show_all') {
      return "Here are all available hotels in New York City.";
    }
    
    if (intent === 'cheapest') {
      return "I'll show you the most affordable option.";
    }
    
    if (intent === 'most_expensive') {
      return "I'll show you the most luxurious option.";
    }

    const parts: string[] = ["I'll search for hotels"];
    
    if (criteria.sentiments?.length) {
      parts.push(`in ${criteria.sentiments.join(' or ')}`);
    }
    
    if (criteria.brands?.length) {
      parts.push(`from ${criteria.brands.join(', ')}`);
    }
    
    if (criteria.amenities?.length) {
      parts.push(`with ${criteria.amenities.join(', ')}`);
    }
    
    if (criteria.priceRange) {
      if (criteria.priceRange.min && criteria.priceRange.max) {
        parts.push(`between $${criteria.priceRange.min}-$${criteria.priceRange.max}`);
      } else if (criteria.priceRange.max) {
        parts.push(`under $${criteria.priceRange.max}`);
      } else if (criteria.priceRange.min) {
        parts.push(`over $${criteria.priceRange.min}`);
      }
    }
    
    if (criteria.minRating) {
      parts.push(`with ${criteria.minRating}+ stars`);
    }

    return parts.join(' ') + '.';
  }

  /**
   * Log errors with context for debugging and monitoring
   * @param errorType - Type/category of error
   * @param error - Error object
   * @param query - Optional user query that caused the error
   */
  private logError(errorType: string, error: Error, query?: string): void {
    const errorLog = {
      timestamp: new Date(),
      errorType,
      message: error.message,
      context: {
        query,
        stackTrace: error.stack
      }
    };
    
    console.error('AI Service Error:', errorLog);
  }

    /**
     * Validate AIResponse structure
     * Ensures all required fields are present and valid
     * @param response - Response object to validate
     * @returns Validation result with valid flag and error messages
     */
    private validateAIResponse(response: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      // Check required fields
      if (!response.intent) {
        errors.push('Missing required field: intent');
      }
      if (!response.message) {
        errors.push('Missing required field: message');
      }
      if (typeof response.shouldSearch !== 'boolean') {
        errors.push('Missing or invalid required field: shouldSearch (must be boolean)');
      }
      if (typeof response.shouldRefine !== 'boolean') {
        errors.push('Missing or invalid required field: shouldRefine (must be boolean)');
      }

      // Validate intent type
      const validIntents = [
        'location_only', 'preferences_only', 'complete_query', 'vague', 'unsupported',
        'show_results_now', 'show_all', 'cheapest', 'most_expensive', 'hotel_info', 'refine_search'
      ];

      if (response.intent && !validIntents.includes(response.intent)) {
        errors.push(`Invalid intent: ${response.intent}. Must be one of: ${validIntents.join(', ')}`);
      }

      // Validate message type
      if (response.message && typeof response.message !== 'string') {
        errors.push('Invalid message field: must be a string');
      }

      // Validate searchCriteria if present
      if (response.searchCriteria !== undefined && response.searchCriteria !== null) {
        if (typeof response.searchCriteria !== 'object') {
          errors.push('Invalid searchCriteria: must be an object');
        } else {
          // Validate searchCriteria fields
          if (response.searchCriteria.brands && !Array.isArray(response.searchCriteria.brands)) {
            errors.push('Invalid searchCriteria.brands: must be an array');
          }
          if (response.searchCriteria.sentiments && !Array.isArray(response.searchCriteria.sentiments)) {
            errors.push('Invalid searchCriteria.sentiments: must be an array');
          }
          if (response.searchCriteria.amenities && !Array.isArray(response.searchCriteria.amenities)) {
            errors.push('Invalid searchCriteria.amenities: must be an array');
          }
          if (response.searchCriteria.priceRange && typeof response.searchCriteria.priceRange !== 'object') {
            errors.push('Invalid searchCriteria.priceRange: must be an object');
          }
          if (response.searchCriteria.minRating && typeof response.searchCriteria.minRating !== 'number') {
            errors.push('Invalid searchCriteria.minRating: must be a number');
          }
          if (response.searchCriteria.sortBy) {
            const validSortOptions = ['price_asc', 'price_desc', 'rating_desc'];
            if (!validSortOptions.includes(response.searchCriteria.sortBy)) {
              errors.push(`Invalid searchCriteria.sortBy: must be one of ${validSortOptions.join(', ')}`);
            }
          }
        }
      }

      // Validate specificHotelId if present
      if (response.specificHotelId !== undefined && response.specificHotelId !== null && typeof response.specificHotelId !== 'string') {
        errors.push('Invalid specificHotelId: must be a string');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    /**
     * Count sentences in a message
     * Sentences are delimited by . ! or ? followed by space or end of string
     * @param message - Message text to analyze
     * @returns Number of sentences found
     */
    private countSentences(message: string): number {
      if (!message || message.trim().length === 0) {
        return 0;
      }

      // Match sentence-ending punctuation followed by space or end of string
      const sentences = message.match(/[^.!?]+[.!?]+/g);
      return sentences ? sentences.length : 0;
    }

    /**
     * Truncate message to specified number of sentences
     * @param message - Message text to truncate
     * @param maxSentences - Maximum number of sentences to keep
     * @returns Truncated message string
     */
    private truncateToSentences(message: string, maxSentences: number): string {
      if (!message || message.trim().length === 0) {
        return message;
      }

      // Split by sentence-ending punctuation while keeping the punctuation
      const sentences = message.match(/[^.!?]+[.!?]+/g);

      if (!sentences || sentences.length <= maxSentences) {
        return message;
      }

      // Take first maxSentences and join them
      return sentences.slice(0, maxSentences).join('').trim();
    }
}
