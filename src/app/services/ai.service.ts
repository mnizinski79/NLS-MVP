import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { AIResponse, ConversationState, SearchCriteria } from '../models';
import { ConfigService } from './config.service';
import { PricingService } from './pricing.service';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private readonly TIMEOUT_MS = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private pricing: PricingService
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

    // Detect points/cash mode switching
    const lowerQuery = query.toLowerCase();
    const pointsKeywords = ['points', 'rewards', 'redeem', 'use points', 'book with points', 'how many points', 'pts'];
    const cashKeywords = ['dollars', 'cash', 'usd', 'show me prices', 'cash price', 'dollar price'];
    const pointsCashKeywords = ['points and cash', 'points + cash', 'points plus cash', 'cash and points', 'mix of points'];
    
    if (pointsCashKeywords.some(k => lowerQuery.includes(k))) {
      this.pricing.setMode('points+cash');
    } else if (pointsKeywords.some(k => lowerQuery.includes(k))) {
      this.pricing.setMode('points');
    } else if (cashKeywords.some(k => lowerQuery.includes(k))) {
      this.pricing.setMode('cash');
    }
    
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

      return `You are a warm and knowledgeable IHG Hotels & Resorts search assistant — like a well-traveled professional who genuinely wants to help you find the perfect stay. You represent IHG and all its brands (Kimpton, voco, InterContinental, Holiday Inn, Holiday Inn Express, Crowne Plaza, Indigo, Candlewood, and more).

---

IHG ONE REWARDS & POINTS:
- This app supports IHG One Rewards points pricing. When a user asks about points, rewards, or redeeming points, the UI AUTOMATICALLY switches all prices to points display.
- You DO have the ability to show points — the system handles it automatically when you detect points intent.
- When a user mentions points, acknowledge it naturally: "Switching to points view!" or "Here are your options in points."
- Do NOT say you can't display points — you CAN and the UI does it automatically.
- Points are calculated at approximately 125x the cash rate (e.g., $200/night ≈ 25,000 points/night).
- There is also a "Points + Cash" option where users pay a mix of points and a reduced cash amount. When a user asks about "points and cash" or "points + cash", the UI switches to this combined view.
- If a user asks to switch back to cash/dollars, acknowledge that too.

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

CRITICAL: SHOW RESULTS FIRST, THEN REFINE
- **ALWAYS show results immediately** when user mentions ANY search criteria (location, amenity, price, brand, etc.)
- **NEVER hold results hostage** behind clarifying questions
- **NEVER ask "what are you looking for?"** before showing results
- If user says "hotels in NYC" or "hotels for 2 people" → SHOW ALL HOTELS immediately
- If user says "hotels in Midtown" → SHOW Midtown hotels immediately
- If user says "pet-friendly hotels" → SHOW pet-friendly hotels immediately
- **After showing results**, offer ONE refinement option
- Only ask clarifying questions if the query is completely vague (e.g., "help me" with no context)

---

CRITICAL: LOCATION REQUIREMENT FOR AMENITY-ONLY QUERIES
- **If user asks ONLY about amenities WITHOUT specifying a location** (e.g., "which hotels have a beachfront", "hotels with a pool", "pet-friendly hotels"):
  1. DO NOT show results (set shouldSearch to false)
  2. Set intent to "preferences_only"
  3. Respond warmly acknowledging the amenity and asking for location
  4. Example: "We have many hotels with **beachfront access** around the globe, such as in **Spain**, **Florida**, and **Thailand**. Where are you looking to go?"
  5. Example: "Great question! We have **pet-friendly** hotels in lots of locations. Are you thinking **New York City**, or somewhere else?"
- **If user specifies BOTH location AND amenity** (e.g., "pet-friendly hotels in NYC", "hotels in NYC with a restaurant"):
  1. ALWAYS show results (set shouldSearch to true, intent to "show_results_now")
  2. If the amenity exists in the data: filter by it and show matching hotels
  3. If the amenity does NOT exist in the data: show ALL hotels in that location and explain the amenity isn't available but suggest alternatives
  4. Example for non-existent amenity: "We don't have any hotels with an **onsite restaurant** in NYC, but we do have hotels with a **Rooftop Bar** or **Cocktail Bar** where you can grab food and drinks. Here are some great options!"
- **Location indicators**: NYC, New York, Manhattan, Midtown, Times Square, Broadway, or any neighborhood/area name
- **This rule applies ONLY to first queries** - if location is already in conversation context, show results

---

TRIGGER PHRASES — Surface results immediately:
- "show me hotels", "just show me", "I'm not sure, just show me", any "show me" variation
- ANY mention of location, amenity, price, brand, or guest count
- "hotels in [location]", "hotels for [number] people", "[amenity] hotels"
- "I need a hotel", "looking for a hotel", "find me a hotel"

---

RESPONSE FORMATTING RULES:
- NEVER list hotel names in your response text — the cards show the names
- NEVER say "Hotel A and Hotel B both have one"
- NEVER reference specific amenities without naming the hotel (e.g., don't say "the hotel with the wine hour" - say "the Kimpton has a hosted wine hour")
- If you need to highlight a specific hotel's feature, use the hotel name: "The [Hotel Name] has [feature]"
- Use singular "hotel" for 1 result, plural for multiple
- Always mention the specific attribute or vibe that drove the selection
- When ≤3 results: DO NOT prompt for dates — the UI date picker handles this automatically

---

GOOD RESPONSE EXAMPLES:
Simple: "Here are 6 hotels near Times Square! A couple of these have rooftop bars with great city views — want me to filter just those, or do you have a budget in mind?"

Specific: "Found 4 pet-friendly hotels in Midtown — these are all well-rated and close to Central Park, which is great for walks. Want to narrow by price or check availability for specific dates?"

Highlighting feature: "The Kimpton Theta has a hosted wine hour that's perfect for your anniversary! It also features a rooftop bar with stunning views."

Vague: "New York's got a lot going on! Are you leaning toward somewhere central like Midtown or Times Square, or something with more character like SoHo or Chelsea? I can pull up options either way."

BAD EXAMPLES (avoid these):
- "The hotel with the wine hour is perfect" (which hotel?)
- "One of them has a pool" (which one?)
- "The one with the rooftop bar" (be specific or don't mention it)

---

DATE & GUEST COUNT:
- When returning ≤3 results, DO NOT include date prompts — the UI handles this
- For ≥4 results, it's natural to ask about dates as your ONE follow-up
- Never stack date AND guest count questions — one ask per response max

Current query: "${query}"${context}

  Available attributes:
  - Locations/Sentiments: Times Square, Broadway, Theater District, Rockefeller Center, Modern, Luxury, Rooftop Bar, Central Location, Value, Family Friendly, Convenient, Skyline Views, New Opening, City Views
  - Amenities: Rooftop Bar, Fitness Center, Pet Friendly, Free Wi-Fi, Spa, Restaurant, Room Service, Concierge, Hosted Wine Hour, Cocktail Bar, Terrace Rooms, Business Center, Grab & Go Market
  - Brands: Kimpton, voco, InterContinental, Holiday Inn, Independent
  - Price ranges: Budget (<$200), Mid-range ($200-400), Luxury (>$400)
  
  CRITICAL - HANDLING NON-EXISTENT AMENITIES:
  - ONLY use amenities from the list above - these are the ONLY amenities that exist in the data
  - If user asks for an amenity NOT in the list (e.g., Pool, Parking, Restaurant, Spa):
    1. DO NOT include it in the amenities filter array
    2. Set shouldSearch to TRUE (show all hotels in the location)
    3. Set intent to "show_results_now"
    4. In your message, be HONEST and offer alternatives: "We don't have any hotels with an **onsite restaurant** in NYC, but we do have hotels with a **Rooftop Bar** or **Cocktail Bar** where you can grab food and drinks. Here are some great options!"
  - Examples of non-existent amenities: Pool, Swimming Pool, Parking, Valet, Airport Shuttle, Laundry, Kitchen, Balcony, Restaurant, Spa, Bar (use "Rooftop Bar" or "Cocktail Bar" instead)
  - ALWAYS show results when location is provided, even if the specific amenity doesn't exist
  - Suggest similar/alternative amenities that DO exist (e.g., "restaurant" → suggest "Rooftop Bar, Cocktail Bar, Room Service")
  - NEVER say "here are hotels with [non-existent amenity]" - be honest about what's missing and what's available instead

  CRITICAL - PRICE IS ALWAYS PER NIGHT:
  - When user mentions budget or price, it is ALWAYS per night, NEVER total trip cost
  - Examples:
    * "budget is $350" = $350 per night (NOT $350 total for 4 nights)
    * "max $400 a night" = $400 per night
    * "around $200" = $200 per night
    * "under $500" = $500 per night
  - Set priceRange.max to the user's stated budget (or slightly higher for flexibility)
  - NEVER divide the budget by number of nights
  - If user says "$350 budget" for a 4-night stay, set priceRange.max to 350-400 (NOT 87.50)

  SENTIMENT MAPPING RULES:
  - "romantic" → use amenities: ["Rooftop Bar"] (rooftop bars offer romantic views)
  - "luxury" or "upscale" → use sentiments: ["Luxury"] OR priceRange: {min: 400, max: null} and minRating: 4.5
  - "budget" or "affordable" → use sentiments: ["Value"] OR priceRange: {min: null, max: 200}
  - "central" or "convenient" → use sentiments: ["Times Square", "Central Location"]
  - "Midtown" or "near Central Park" or "Rockefeller Center" → use sentiments: ["Rockefeller Center"] OR leave sentiments empty (all hotels are in central NYC)
  - "Times Square" or "Broadway" or "Theater District" → use sentiments: ["Times Square", "Broadway", "Theater District"]
  - "family-friendly" or "good for families" or "kid-friendly" → use sentiments: ["Family Friendly"]
  - "modern" or "trendy" → use sentiments: ["Modern"]
  - DO NOT use sentiment values that don't exist in the data
  - When user asks for vibe/feeling, translate to concrete amenities or locations
  - If unsure about location mapping, leave sentiments empty rather than using non-existent values
  
  CRITICAL - DO NOT AUTO-ADD "FAMILY FRIENDLY":
  - Just because someone mentions children or traveling with kids does NOT mean they want "Family Friendly" sentiment
  - Only add "Family Friendly" sentiment if user explicitly says "family-friendly", "good for families", or "kid-friendly"
  - Examples:
    * "2 adults and 1 child" → DO NOT add Family Friendly (just extract guest count)
    * "traveling with kids" → DO NOT add Family Friendly (just extract guest count)
    * "family of 4" → DO NOT add Family Friendly (just extract guest count)
    * "family-friendly hotel" → ADD Family Friendly sentiment
    * "good for families" → ADD Family Friendly sentiment

  BUDGET INTERPRETATION - CRITICAL:
  - User budget is ALWAYS per night, never total trip cost
  - When user specifies a budget (e.g., "max $400", "$350 budget", "under $300"):
    1. FIRST: Set priceRange.max to EXACTLY the user's stated budget
    2. If this returns 0 results, the backend will automatically expand and show cheapest options
    3. DO NOT pre-emptively widen the budget in your filter
  - Examples:
    * "budget is $350" → set priceRange.max to 350 (exactly)
    * "max $400 a night" → set priceRange.max to 400 (exactly)
    * "under $300" → set priceRange.max to 300 (exactly)
  - In your message, acknowledge the budget: "Here are hotels within your $350/night budget" or "Here are the most affordable options close to your $300 budget"
  - The system will handle showing over-budget options if needed, sorted by price

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
    * "this weekend" = FRIDAY to SUNDAY of the closest upcoming weekend
      - If today is Mon-Thu: this weekend = the upcoming Friday-Sunday of this week
      - If today is Fri-Sun: this weekend = this Friday through Sunday (starting from today or the most recent Friday)
    * "next weekend" = FRIDAY to SUNDAY of the weekend AFTER "this weekend"
      - Always the Friday-Sunday that comes after "this weekend"
      - Example: If today is Monday, "next weekend" = Friday-Sunday of NEXT week (not this week)
    * "tomorrow" = the day after today
    * "next Friday" = the next occurrence of Friday
  - CRITICAL: Weekends are ALWAYS Friday check-in, Sunday check-out (NOT Thursday-Saturday)
  - WEEKEND CALCULATION EXAMPLES (today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}):
    * If today is Monday March 9, 2026:
      - "this weekend" = Friday March 13, 2026 to Sunday March 15, 2026
      - "next weekend" = Friday March 20, 2026 to Sunday March 22, 2026
    * If today is Thursday March 12, 2026:
      - "this weekend" = Friday March 13, 2026 to Sunday March 15, 2026
      - "next weekend" = Friday March 20, 2026 to Sunday March 22, 2026
    * If today is Friday March 13, 2026:
      - "this weekend" = Friday March 13, 2026 to Sunday March 15, 2026
      - "next weekend" = Friday March 20, 2026 to Sunday March 22, 2026
  - Convert all dates to ISO format (YYYY-MM-DD)
  - Current date for reference: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})
  - If dates are mentioned, include them in checkIn and checkOut fields
  - If no dates mentioned, leave checkIn and checkOut as null

  GUEST COUNT EXTRACTION:
  - Extract adults and children separately from the user's query
  - Examples:
    * "going with 3 friends" = 4 adults, 0 children
    * "for 2 people" = 2 adults, 0 children
    * "me and my partner" = 2 adults, 0 children
    * "family of 4" = 4 adults, 0 children (unless children are explicitly mentioned)
    * "2 adults and 1 child" = 2 adults, 1 child
    * "2 adults and 2 kids" = 2 adults, 2 children
    * "3 adults and a 7 year old" = 3 adults, 1 child
    * "just me" or "solo" = 1 adult, 0 children
    * "group of 6" = 6 adults, 0 children
  - Always count the user as 1 person when they say "with X friends/people"
  - If no guest count mentioned, leave both adults and children as null
  - IMPORTANT: Extract both "adults" and "children" fields separately in your JSON response

  POI (POINT OF INTEREST) EXTRACTION:
  - Extract landmarks or locations mentioned by the user (e.g., "near Central Park", "close to Times Square", "walking distance to Broadway", "I'm interested in Central Park", "We want to see Times Square")
  - Common NYC POIs and their coordinates:
    * Central Park: {lat: 40.785091, lng: -73.968285}
    * Times Square: {lat: 40.758896, lng: -73.985130}
    * Rockefeller Center: {lat: 40.758740, lng: -73.978674}
    * Empire State Building: {lat: 40.748817, lng: -73.985428}
    * Broadway Theater District: {lat: 40.759011, lng: -73.984472}
    * Grand Central Terminal: {lat: 40.752726, lng: -73.977229}
    * Madison Square Garden: {lat: 40.750504, lng: -73.993439}
    * Bryant Park: {lat: 40.753597, lng: -73.983233}
  - CRITICAL: POI extraction is for MAP DISPLAY ONLY - it does NOT filter results
  - When user mentions a POI (e.g., "I'm interested in Central Park", "We want to see Times Square"):
    1. Extract the POI and include it in pointOfInterest field
    2. Set shouldSearch to TRUE to show ALL hotels (do not filter by location)
    3. The POI marker will appear on the map alongside all hotel results
    4. In your message, acknowledge the POI: "Great! I'll show you hotels in NYC and mark **Central Park** on the map so you can see what's nearby."
  - If no specific POI mentioned, leave pointOfInterest as null

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
    "adults": number or null,
    "children": number or null,
    "pointOfInterest": {"name": "string", "coordinates": {"lat": number, "lng": number}} or null,
    "searchSummary": "Short 2-4 word TLDR of the search vibe (e.g., 'Romantic getaway', 'Budget-friendly stay', 'Family vacation', 'Luxury escape', 'Pet-friendly options', 'Business trip'). Required when shouldSearch is true."
  }


  SPECIAL INTENTS:
  - "show_all": User wants to see all hotels without filters - set shouldSearch to true, shouldRefine to false, with empty criteria
  - "show_results_now": User mentions ANY search criteria (location, guests, amenity, price) - ALWAYS set shouldSearch to true and return results immediately
    * Examples: "hotels in NYC", "hotels for 2 people", "pet-friendly hotels", "hotels in Midtown"
    * NEVER ask clarifying questions first - show results, then offer refinements
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

        console.log('🔍 RAW GEMINI RESPONSE:', {
          query: query,
          responseText: responseText,
          fullApiResponse: apiResponse
        });

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

        console.log('🔍 CLEANED JSON TEXT:', cleanedText);

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

        // 🔍 DEBUG: Log extracted dates
        console.log('🔍 AI DATE EXTRACTION DEBUG:', {
          query: query,
          rawCheckIn: parsed.checkIn,
          rawCheckOut: parsed.checkOut,
          checkInType: typeof parsed.checkIn,
          checkOutType: typeof parsed.checkOut,
          adults: parsed.adults,
          children: parsed.children,
          fullResponse: parsed
        });

        return {
          intent: parsed.intent,
          message: parsed.message,
          searchCriteria: parsed.searchCriteria,
          shouldSearch: parsed.shouldSearch,
          shouldRefine: parsed.shouldRefine,
          specificHotelId: parsed.specificHotelId,
          checkIn: parsed.checkIn,
          checkOut: parsed.checkOut,
          adults: parsed.adults,
          children: parsed.children,
          pointOfInterest: parsed.pointOfInterest,
          searchSummary: parsed.searchSummary
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
    const locationKeywords = [
      'times square', 'broadway', 'theater district', 'rockefeller center',
      'financial district', 'chelsea', 'soho', 'tribeca', 
      'upper east side', 'upper west side', 'luxury', 'modern'
    ];
    
    // Map broader location terms to specific sentiment keywords
    const locationMappings: Record<string, string[]> = {
      'midtown': ['Times Square', 'Theater District', 'Rockefeller Center', 'Broadway'],
      'times square': ['Times Square'],
      'broadway': ['Broadway', 'Theater District'],
      'theater district': ['Theater District'],
      'rockefeller center': ['Rockefeller Center']
    };
    
    let foundSentiments: string[] = [];
    
    // Check for direct matches first
    const foundLocations = locationKeywords.filter(loc => lowerQuery.includes(loc));
    if (foundLocations.length > 0) {
      foundSentiments = foundLocations.map(loc => 
        loc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      );
    }
    
    // Check for mapped locations (like "midtown")
    for (const [key, mappedSentiments] of Object.entries(locationMappings)) {
      if (lowerQuery.includes(key)) {
        foundSentiments.push(...mappedSentiments);
      }
    }
    
    // Remove duplicates and set criteria
    if (foundSentiments.length > 0) {
      criteria.sentiments = [...new Set(foundSentiments)];
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
