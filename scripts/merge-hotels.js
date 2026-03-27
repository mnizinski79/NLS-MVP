const fs = require('fs');
const path = require('path');

const hotelsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/assets/hotels-new.json'), 'utf8'));
const ratesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/assets/hotels-new-rates.json'), 'utf8'));

const hotelInfoList = hotelsRaw.data.getHotels.hotelInfo;

// Build rates lookup by hotelMnemonic
const ratesMap = {};
for (const r of ratesRaw.hotels) {
  ratesMap[r.hotelMnemonic] = r;
}

// Brand code → app brand name
const brandMap = {
  'KI': 'Kimpton',
  'KIKI': 'Kimpton',
  'VX': 'voco',
  'VXVX': 'voco',
  'IC': 'InterContinental',
  'ICON': 'InterContinental',
  'HI': 'Holiday Inn',
  'HIHI': 'Holiday Inn',
  'CP': 'Crowne Plaza',
  'CPCP': 'Crowne Plaza',
  'IN': 'Indigo',
  'ININ': 'Indigo',
  'HX': 'Holiday Inn Express',
  'HXHX': 'Holiday Inn Express',
  'AV': 'Avid',
  'AVAV': 'Avid',
  'GN': 'Garner',
  'GNGN': 'Garner',
  'EV': 'Even',
  'EVEV': 'Even',
  'CW': 'Candlewood',
  'CWCW': 'Candlewood',
  'SS': 'Six Senses',
  'SSSS': 'Six Senses',
  'RG': 'Regent',
  'RGRG': 'Regent',
  'VI': 'Vignette',
  'VIVI': 'Vignette',
};

// Facility id → amenity name
const facilityMap = {
  'WIRELESS_INTERNET': 'Free Wi-Fi',
  'PETS_ALLOWED': 'Pet Friendly',
  'HEALTH_FITNESS_CENTER': 'Fitness Center',
  'IN_HOTEL_RESTAURANTS': 'Restaurant',
  'BUSINESS_CENTER': 'Business Center',
  'SUITES': 'Suites',
  'SUSTAINABLE_PRACTICES': 'Sustainable Practices',
  'ENTERTAINMENT': 'Entertainment',
  'POOL': 'Pool',
  'SPA': 'Spa',
  'CONCIERGE': 'Concierge',
  'ROOM_SERVICE': 'Room Service',
  'BAR_LOUNGE': 'Cocktail Bar',
  'ROOFTOP': 'Rooftop Bar',
};

// Stripe id → badge
const stripeMap = {
  'NEWLY_OPEN': { icon: 'ph-fill ph-sparkle', text: 'New hotel' },
  'SUSTAINABLE_PRACTICES': { icon: 'ph-fill ph-leaf', text: 'Sustainable practices' },
};

// Green engage → sustainable badge
function getSustainableBadge(hotel) {
  const cert = hotel.greenEngage?.certificationPrograms?.certifiedByGloballyRecognizedSustainableProgram;
  if (cert) return { icon: 'ph-fill ph-leaf', text: 'Sustainable practices' };
  return null;
}

const results = [];

for (const h of hotelInfoList) {
  const code = h.hotelCode;
  const rates = ratesMap[code];

  // Pricing
  const baseAmount = rates ? parseFloat(rates.lowestCashOnlyCost?.baseAmount || '0') : 0;
  const fees = rates ? parseFloat(rates.lowestCashOnlyCost?.feeTaxSubTotals?.find(f => f.otaCodeType === 'FEE')?.amount || '0') : 0;

  // Brand
  const chainCode = h.brandInfo?.chainCode || '';
  const brandCode = h.brandInfo?.brandCode || '';
  const brand = brandMap[chainCode] || brandMap[brandCode] || 'Independent';

  // Images — welcome photo first, then the rest
  const allPhotos = h.media?.primaryPhotos?.allPhotos || [];
  const welcomePhoto = allPhotos.find(p => p.type === 'primaryWelcomePhoto');
  const otherPhotos = allPhotos.filter(p => p.type !== 'primaryWelcomePhoto');
  const orderedPhotos = welcomePhoto ? [welcomePhoto, ...otherPhotos] : allPhotos;
  const imageUrls = orderedPhotos.map(p => p.originalUrl).filter(Boolean);
  // Fallback to profile primary image
  if (imageUrls.length === 0 && h.profile?.primaryImageUrl?.originalUrl) {
    imageUrls.push(h.profile.primaryImageUrl.originalUrl);
  }

  // Amenities from facilities
  const amenities = (h.facilities || [])
    .map(f => facilityMap[f.id])
    .filter(Boolean);

  // Badge — stripes first, then green engage
  let badge = null;
  if (h.stripes && h.stripes.length > 0) {
    badge = stripeMap[h.stripes[0].id] || null;
  }
  if (!badge) {
    badge = getSustainableBadge(h);
  }

  // Description
  const desc = h.marketing?.marketingText?.welcomeMessage || '';
  const cleanDesc = desc.replace(/<[^>]+>/g, '').trim();

  // Rating
  const rating = h.profile?.averageReview ? Math.round(h.profile.averageReview * 10) / 10 : null;

  // Booking URL
  const bookingUrl = `https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?fromRedirect=true&qSrt=sBR&qSlH=${code}&setPMCookies=true`;

  const hotel = {
    id: code,
    name: `${h.brandInfo?.brandName || brand} ${h.profile?.name || ''}`.trim(),
    brand,
    rating: rating || 4.0,
    location: {
      address: [h.address?.street1, h.address?.city, h.address?.state?.code, h.address?.zip].filter(Boolean).join(', '),
      neighborhood: h.address?.city || '',
      coordinates: {
        lat: h.profile?.latLong?.lat || 0,
        lng: h.profile?.latLong?.lon || 0,
      }
    },
    pricing: {
      nightlyRate: Math.round(baseAmount),
      roomRate: Math.round(baseAmount),
      fees: Math.round(fees),
    },
    amenities,
    description: cleanDesc.slice(0, 400),
    imageUrls,
    phone: h.callCenter?.phoneNumber || '',
    sentiment: [],
    bookingUrl,
    ...(badge ? { badge } : {}),
  };

  results.push(hotel);
}

const output = JSON.stringify(results, null, 2);
fs.writeFileSync(path.join(__dirname, '../src/assets/hotels.json'), output, 'utf8');
console.log(`✅ Merged ${results.length} hotels into hotels.json`);
