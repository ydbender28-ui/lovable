export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  prompt: string;         // The prompt to send to generate this template
  previewColor: string;   // Accent color hex for preview card
  tags: string[];
}

export const STARTER_TEMPLATES: Template[] = [
  {
    id: 'luxury-spa',
    name: 'Luxury Spa & Wellness',
    category: 'Health & Beauty',
    description: 'Premium spa with services menu, booking, gallery, and reviews',
    emoji: '🌿',
    previewColor: '#8B7355',
    tags: ['spa', 'wellness', 'booking'],
    prompt: `Create a luxury spa and wellness center website called "Serenity Spa" located in Beverly Hills, CA.
Services: Deep Tissue Massage ($120), Hot Stone Massage ($140), HydraFacial ($180), Couples Retreat Package ($280), CBD Relaxation Massage ($130).
Design: Warm earth tones, elegant serif fonts, full-width nature imagery.
Sections: Navbar with Book Now CTA, Hero with background spa image, StickyBar (15% off first visit), ServiceCards, BeforeAfter (skin transformations), Team (3 licensed therapists), Reviews (5-star Google reviews), Booking, MapSection, Footer.
Content: Professional, luxurious tone. Real prices, specific service descriptions.`,
  },
  {
    id: 'modern-restaurant',
    name: 'Modern Restaurant',
    category: 'Food & Beverage',
    description: 'Restaurant with full menu, gallery, hours, and reservations',
    emoji: '🍽️',
    previewColor: '#C2410C',
    tags: ['restaurant', 'menu', 'reservations'],
    prompt: `Create a modern farm-to-table restaurant website called "The Harvest Table" in Austin, TX.
Menu highlights: Truffle Risotto ($28), Pan-Seared Salmon ($34), Wagyu Burger ($22), Seasonal Tasting Menu ($85/person).
Design: Warm, earthy, moody lighting aesthetic. Rich burgundy and cream colors.
Sections: Navbar (Reserve a Table CTA), Banner (Prix Fixe Friday Nights - $65), Hero (stunning food photo), MenuGrid (Starters/Mains/Desserts/Cocktails), Gallery (food + ambiance photos), SocialProof, Reviews, HoursTable, MapSection, Footer.`,
  },
  {
    id: 'saas-landing',
    name: 'SaaS Product Landing',
    category: 'Tech & SaaS',
    description: 'Clean SaaS landing page with features, pricing, and social proof',
    emoji: '🚀',
    previewColor: '#6366F1',
    tags: ['saas', 'tech', 'startup'],
    prompt: `Create a SaaS product landing page for "FlowDesk" - an AI-powered customer support platform for e-commerce brands.
Key features: AI ticket routing, automated responses, Shopify/WooCommerce integration, real-time analytics, team inbox.
Design: Clean, modern, purple/indigo accent, dark mode hero.
Sections: Navbar (Start Free Trial CTA), Hero (dark gradient, bold headline "Cut Support Time by 73%"), LogoCloud (trusted by Shopify brands), Features (6 key features with icons), Comparison (vs Zendesk, vs Gorgias), PricingTable (Starter $49/mo, Pro $99/mo, Scale $249/mo), FAQ, CTA (14-day free trial), Footer.`,
  },
  {
    id: 'fitness-gym',
    name: 'Fitness Gym',
    category: 'Health & Fitness',
    description: 'Gym or fitness studio with classes, membership pricing, and trainers',
    emoji: '💪',
    previewColor: '#DC2626',
    tags: ['gym', 'fitness', 'membership'],
    prompt: `Create a premium fitness gym website for "Iron & Sweat Gym" in Miami, FL.
Programs: Personal Training, Group HIIT Classes, Powerlifting, CrossFit, Yoga & Recovery.
Membership: Day Pass $20, Monthly $69/mo, Annual $599/yr, VIP Unlimited $99/mo.
Design: Bold, energetic, black and red color scheme. High-energy photography.
Sections: Navbar (Join Today CTA), Hero (action shot, bold headline), SocialProof (500+ members, 4.9 stars), ServiceCards (programs with details), StepProcess (Join→Assess→Train→Transform), Team (4 certified trainers), PricingTable (membership options), Reviews (transformation stories), Contact, Footer.`,
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    category: 'Professional Services',
    description: 'Professional law firm with practice areas, team, and consultation booking',
    emoji: '⚖️',
    previewColor: '#1E3A5F',
    tags: ['law', 'professional', 'legal'],
    prompt: `Create a professional law firm website for "Sterling & Associates Law" in New York, NY.
Practice areas: Personal Injury, Business Law, Real Estate, Estate Planning, Immigration.
Stats: 25+ years experience, $50M+ recovered, 3,000+ cases won, 98% client satisfaction.
Design: Navy blue and gold, authoritative, classic serif typography.
Sections: Navbar (Free Consultation CTA), Hero (confident attorney photo, dark overlay), Stats, ServiceCards (practice areas), Team (5 attorneys with credentials and bar admissions), Timeline (case process), SocialProof (Super Lawyers, Avvo 10.0), Reviews, Contact, Footer.`,
  },
  {
    id: 'boutique-hotel',
    name: 'Boutique Hotel',
    category: 'Hospitality',
    description: 'Luxury hotel with rooms, amenities, gallery, and booking',
    emoji: '🏨',
    previewColor: '#78350F',
    tags: ['hotel', 'travel', 'luxury'],
    prompt: `Create a boutique hotel website for "The Clifton House" - a luxury boutique hotel in Charleston, SC.
Rooms: Garden Suite $289/night, Ocean View King $349/night, Penthouse Suite $589/night.
Amenities: Rooftop pool, farm-to-table restaurant, full-service spa, concierge.
Design: Warm ivory and deep brown, elegant photography, luxurious feel.
Sections: Navbar (Book Now CTA), Hero (stunning hotel exterior), Gallery (rooms + amenities), Features (what makes it special), PricingTable (room types), Reviews (TripAdvisor-style), MapSection (Charleston location), Contact, Footer.`,
  },
  {
    id: 'dental-practice',
    name: 'Dental Practice',
    category: 'Healthcare',
    description: 'Modern dental office with services, team, before/after, and booking',
    emoji: '🦷',
    previewColor: '#0EA5E9',
    tags: ['dental', 'medical', 'healthcare'],
    prompt: `Create a modern dental practice website for "Bright Smile Dental" in Phoenix, AZ.
Services: Teeth Whitening ($299), Invisalign ($3,500+), Dental Implants ($1,800+), Veneers ($900/tooth), Emergency Care, Regular Cleanings ($150).
Special offer: New patient exam + X-rays for $99.
Design: Clean, bright white and sky blue, clinical yet friendly.
Sections: Navbar (Book Appointment CTA), Hero (modern office photo with friendly dentist), Banner (New Patient Special - $99 Exam + X-Rays), ServiceCards (services), TrustBadges (ADA, Delta Dental, Cigna, insurance accepted), Team (3 dentists with credentials), BeforeAfter (smile transformations), Reviews (Google 4.9 stars), Booking, MapSection, Footer.`,
  },
  {
    id: 'ecommerce-store',
    name: 'E-Commerce Store',
    category: 'Retail',
    description: 'Online store with products, cart, reviews, and newsletter',
    emoji: '🛍️',
    previewColor: '#7C3AED',
    tags: ['ecommerce', 'shop', 'retail'],
    prompt: `Create a premium skincare e-commerce store called "Lumière Skin" selling luxury skincare products.
Products: Vitamin C Serum $68, Retinol Night Cream $89, Hyaluronic Toner $45, SPF 50 Day Cream $54, Eye Cream $72, Overnight Mask $58.
Design: Minimalist, clean whites and soft gold accents, high-end beauty aesthetic.
Sections: Navbar (cart icon), Banner (Free shipping on orders over $75), Hero (product hero shot), ShopGrid (6 products with add to cart), Features (clean ingredients, dermatologist tested, sustainable packaging), SocialProof (50,000+ happy customers), Reviews (5-star reviews with photos mentioned), Newsletter (15% off first order), Footer.`,
  },
  {
    id: 'real-estate',
    name: 'Real Estate Agent',
    category: 'Real Estate',
    description: 'Realtor site with listings, stats, testimonials, and contact',
    emoji: '🏠',
    previewColor: '#059669',
    tags: ['real estate', 'property', 'realtor'],
    prompt: `Create a real estate agent website for Sarah Mitchell, top-producing Realtor at Compass in San Francisco, CA.
Stats: $80M+ in sales, 12 years experience, 350+ homes sold, 4.9 star rating.
Services: Buyer representation, seller listing, investment properties, relocation, market analysis.
Design: Clean, modern green and white, professional photography.
Sections: Navbar (Schedule Consultation CTA), Hero (professional headshot with SF skyline), Stats, ServiceCards (buy/sell/invest/relocate), Team (Sarah + 2 team members), Testimonials (5 detailed client reviews), CTA (free home valuation), Contact, MapSection, Footer.`,
  },
  {
    id: 'photography-studio',
    name: 'Photography Studio',
    category: 'Creative',
    description: 'Portfolio site with galleries, packages, and booking',
    emoji: '📷',
    previewColor: '#111827',
    tags: ['photography', 'portfolio', 'creative'],
    prompt: `Create a photography studio portfolio website for "Lucas Vance Photography" in Nashville, TN. Specializing in weddings, portraits, and commercial work.
Packages: Portrait Session $350, Engagement $550, Wedding Full Day $3,200, Elopement $1,800, Commercial half day $800.
Design: Dark, moody, minimal. Black background with white text and gold accents. Let the photography shine.
Sections: Navbar, Hero (stunning portfolio image, full bleed), Portfolio (Wedding/Portrait/Commercial galleries), Stats (500+ weddings, 8 years, 5-star rated), Team (Lucas bio + 2 second shooters), PricingTable (packages), Reviews (bride testimonials), Booking (availability calendar), Contact, Footer.`,
  },
  {
    id: 'personal-trainer',
    name: 'Personal Trainer',
    category: 'Fitness',
    description: '1-on-1 trainer with transformation results, programs, and booking',
    emoji: '🏋️',
    previewColor: '#F97316',
    tags: ['fitness', 'trainer', 'coaching'],
    prompt: `Create a personal trainer website for Marcus Reed, certified personal trainer and nutrition coach in Los Angeles, CA.
Programs: 1-on-1 Personal Training ($120/session), 12-Week Body Transformation ($1,497), Online Coaching ($197/mo), Nutrition Coaching ($97/mo).
Results: 200+ clients transformed, avg 22 lbs lost in 12 weeks, 4.9 star rating.
Design: Bold, energetic, dark with orange accents. Transformation-focused imagery.
Sections: Navbar (Book Free Consult CTA), Hero (Marcus action shot, bold "Your Transformation Starts Here"), Stats, Features (training approach), BeforeAfter (client transformations), PricingTable (programs), Testimonials (detailed success stories), Booking (free strategy call), Contact, Footer.`,
  },
  {
    id: 'wedding-venue',
    name: 'Wedding Venue',
    category: 'Events',
    description: 'Wedding venue with spaces, packages, gallery, and inquiry form',
    emoji: '💍',
    previewColor: '#BE185D',
    tags: ['wedding', 'events', 'venue'],
    prompt: `Create a luxury wedding venue website for "Rosewood Estate" - a private estate venue in Napa Valley, CA.
Capacity: Ceremony 200 guests, Reception 250 guests, Intimate events 50 guests.
Packages: Intimate Elopement $4,500, Garden Ceremony $8,500, Grand Estate Wedding $18,000+.
Includes: Full day venue access, bridal suite, catering kitchen, outdoor pavilion, vineyard views.
Design: Romantic, elegant, soft blush and cream with gold accents. Breathtaking photography.
Sections: Navbar (Check Availability CTA), Hero (golden hour venue photo), Gallery (ceremony, reception, detail shots), Stats (500+ weddings hosted, 50 acres, 4.9 stars), Features (what's included), PricingTable (packages), Reviews (bride/groom testimonials), Booking (availability inquiry), MapSection, Footer.`,
  },
];

export function getTemplatesByCategory(): Record<string, Template[]> {
  const grouped: Record<string, Template[]> = {};
  for (const t of STARTER_TEMPLATES) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  return grouped;
}
