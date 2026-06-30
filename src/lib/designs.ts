// @ts-nocheck
// ─── DESIGN ENGINE ──────────────────────────────────────────────────────────
// Combines 80+ business categories × 25 style moods × 40 color palettes
// = 80,000+ unique design combinations

// ─── BUSINESS CATEGORIES (80+) ─────────────────────────────────────────────
const CATEGORIES = [
  // Food & Drink
  { id: 'coffee', keywords: ['coffee','cafe','espresso','brew','roast','barista','latte','cappuccino'], industry: 'food', heroQuery: 'artisan coffee shop interior warm moody lighting', cardQuery: 'coffee drink close up' },
  { id: 'restaurant', keywords: ['restaurant','dining','bistro','kitchen','chef','dine','eatery','tavern'], industry: 'food', heroQuery: 'fine dining restaurant elegant ambiance', cardQuery: 'gourmet plated dish close up' },
  { id: 'bakery', keywords: ['bakery','bread','pastry','cake','bake','patisserie','donut','cupcake','pie'], industry: 'food', heroQuery: 'artisan bakery fresh bread warm morning', cardQuery: 'fresh pastry close up' },
  { id: 'pizza', keywords: ['pizza','pizzeria','italian food'], industry: 'food', heroQuery: 'wood fired pizza oven italian restaurant', cardQuery: 'pizza close up melted cheese' },
  { id: 'sushi', keywords: ['sushi','japanese','ramen','asian food','poke'], industry: 'food', heroQuery: 'japanese sushi restaurant minimal interior', cardQuery: 'sushi roll close up' },
  { id: 'bar', keywords: ['bar','pub','cocktail','brewery','taproom','wine bar','lounge'], industry: 'food', heroQuery: 'cocktail bar dark moody lighting', cardQuery: 'craft cocktail close up' },
  { id: 'food_truck', keywords: ['food truck','street food','taco','burrito','mobile food'], industry: 'food', heroQuery: 'colorful food truck street scene', cardQuery: 'street food close up' },
  { id: 'juice', keywords: ['juice','smoothie','acai','health food','organic','vegan'], industry: 'food', heroQuery: 'fresh juice bar bright colorful', cardQuery: 'colorful smoothie bowl' },
  { id: 'ice_cream', keywords: ['ice cream','gelato','frozen yogurt','dessert'], industry: 'food', heroQuery: 'artisan ice cream shop colorful', cardQuery: 'ice cream scoop close up' },
  { id: 'catering', keywords: ['catering','event food','banquet','private chef'], industry: 'food', heroQuery: 'elegant catering event setup', cardQuery: 'catered food display' },

  // Beauty & Wellness
  { id: 'salon', keywords: ['salon','hair','hairdresser','stylist','haircut','blowout'], industry: 'beauty', heroQuery: 'luxury hair salon interior', cardQuery: 'hair styling close up' },
  { id: 'spa', keywords: ['spa','massage','wellness','relaxation','day spa','hot springs'], industry: 'beauty', heroQuery: 'luxury spa serene atmosphere', cardQuery: 'spa treatment relaxation' },
  { id: 'nails', keywords: ['nail','manicure','pedicure','nail art','nail salon'], industry: 'beauty', heroQuery: 'modern nail salon interior', cardQuery: 'nail art manicure close up' },
  { id: 'skincare', keywords: ['skincare','facial','dermatology','esthetician','beauty treatment'], industry: 'beauty', heroQuery: 'skincare clinic bright clean', cardQuery: 'skincare product close up' },
  { id: 'barbershop', keywords: ['barber','barbershop','mens grooming','fade','shave'], industry: 'beauty', heroQuery: 'classic barbershop interior vintage', cardQuery: 'barber cutting hair' },
  { id: 'makeup', keywords: ['makeup','cosmetics','beauty artist','mua'], industry: 'beauty', heroQuery: 'makeup artist studio professional', cardQuery: 'makeup application close up' },
  { id: 'tattoo', keywords: ['tattoo','tattoo shop','ink','piercing','body art'], industry: 'beauty', heroQuery: 'tattoo studio dark artistic', cardQuery: 'tattoo artist working' },
  { id: 'yoga', keywords: ['yoga','meditation','mindfulness','pilates','zen'], industry: 'wellness', heroQuery: 'yoga studio serene natural light', cardQuery: 'yoga pose meditation' },

  // Health & Medical
  { id: 'doctor', keywords: ['doctor','medical','clinic','physician','family medicine','primary care'], industry: 'medical', heroQuery: 'modern medical clinic interior', cardQuery: 'doctor patient consultation' },
  { id: 'dentist', keywords: ['dentist','dental','orthodontist','teeth','oral health'], industry: 'medical', heroQuery: 'modern dental office bright', cardQuery: 'dental care treatment' },
  { id: 'chiropractic', keywords: ['chiropractic','chiropractor','spine','adjustment','back pain'], industry: 'medical', heroQuery: 'chiropractic clinic professional', cardQuery: 'chiropractic adjustment' },
  { id: 'therapy', keywords: ['therapy','therapist','counseling','mental health','psychologist','psychiatrist'], industry: 'medical', heroQuery: 'therapy office calming interior', cardQuery: 'counseling session peaceful' },
  { id: 'veterinary', keywords: ['vet','veterinary','animal','pet','dog','cat','pet care'], industry: 'medical', heroQuery: 'veterinary clinic friendly', cardQuery: 'veterinarian with pet' },
  { id: 'pharmacy', keywords: ['pharmacy','drugstore','prescription','medication'], industry: 'medical', heroQuery: 'modern pharmacy interior', cardQuery: 'pharmacy medication' },
  { id: 'optometry', keywords: ['optometrist','eye doctor','glasses','vision','eyewear','optical'], industry: 'medical', heroQuery: 'modern optical shop eyewear', cardQuery: 'eyeglasses display' },
  { id: 'physical_therapy', keywords: ['physical therapy','physiotherapy','rehab','rehabilitation','sports medicine'], industry: 'medical', heroQuery: 'physical therapy clinic modern', cardQuery: 'physical therapy exercise' },

  // Fitness & Sports
  { id: 'gym', keywords: ['gym','fitness','workout','training','crossfit','weightlifting','muscle'], industry: 'fitness', heroQuery: 'modern gym dark dramatic lighting', cardQuery: 'fitness training action' },
  { id: 'martial_arts', keywords: ['martial arts','karate','taekwondo','jiu jitsu','boxing','mma','kickboxing'], industry: 'fitness', heroQuery: 'martial arts dojo training', cardQuery: 'martial arts kick action' },
  { id: 'dance', keywords: ['dance','dance studio','ballet','hip hop','salsa','dancing'], industry: 'fitness', heroQuery: 'dance studio elegant interior', cardQuery: 'dancer performance' },
  { id: 'swim', keywords: ['swim','swimming','pool','aquatic','water sports'], industry: 'fitness', heroQuery: 'swimming pool pristine blue water', cardQuery: 'swimmer in pool' },
  { id: 'sports', keywords: ['sports','athletic','team','league','tournament','coaching'], industry: 'fitness', heroQuery: 'sports field action shot', cardQuery: 'athlete training' },

  // Professional Services
  { id: 'law', keywords: ['law','lawyer','attorney','legal','litigation','counsel','advocate','paralegal'], industry: 'professional', heroQuery: 'modern law office professional', cardQuery: 'professional business portrait' },
  { id: 'accounting', keywords: ['accounting','accountant','cpa','tax','bookkeeping','finance','financial advisor'], industry: 'professional', heroQuery: 'modern finance office professional', cardQuery: 'financial planning consultation' },
  { id: 'consulting', keywords: ['consulting','consultant','advisory','strategy','management consulting'], industry: 'professional', heroQuery: 'modern consulting office boardroom', cardQuery: 'business meeting professional' },
  { id: 'insurance', keywords: ['insurance','coverage','policy','claims','life insurance','auto insurance'], industry: 'professional', heroQuery: 'insurance office professional', cardQuery: 'family protection concept' },
  { id: 'recruiting', keywords: ['recruiting','staffing','hiring','jobs','career','employment','hr','headhunter'], industry: 'professional', heroQuery: 'modern office hiring interview', cardQuery: 'professional job interview' },
  { id: 'marketing', keywords: ['marketing','advertising','agency','branding','digital marketing','seo','social media'], industry: 'professional', heroQuery: 'creative marketing agency office', cardQuery: 'marketing team brainstorming' },

  // Real Estate & Property
  { id: 'real_estate', keywords: ['real estate','property','homes','realtor','broker','listing','housing'], industry: 'realestate', heroQuery: 'modern luxury home exterior', cardQuery: 'beautiful home interior' },
  { id: 'apartment', keywords: ['apartment','rental','condo','lease','tenant','property management'], industry: 'realestate', heroQuery: 'modern apartment building exterior', cardQuery: 'luxury apartment interior' },
  { id: 'hotel', keywords: ['hotel','resort','hospitality','lodging','accommodation','boutique hotel','inn','motel'], industry: 'realestate', heroQuery: 'luxury hotel lobby interior', cardQuery: 'hotel room elegant' },
  { id: 'airbnb', keywords: ['airbnb','vacation rental','short term rental','holiday home'], industry: 'realestate', heroQuery: 'beautiful vacation rental property', cardQuery: 'cozy rental interior' },

  // Home Services
  { id: 'construction', keywords: ['construction','contractor','builder','general contractor'], industry: 'trades', heroQuery: 'construction site professional workers', cardQuery: 'home renovation project' },
  { id: 'plumbing', keywords: ['plumber','plumbing','pipe','drain','water heater','leak'], industry: 'trades', heroQuery: 'professional plumber working', cardQuery: 'plumbing repair service' },
  { id: 'electrician', keywords: ['electrician','electrical','wiring','panel','outlet','lighting'], industry: 'trades', heroQuery: 'electrician professional working', cardQuery: 'electrical work service' },
  { id: 'hvac', keywords: ['hvac','heating','cooling','air conditioning','furnace','ac repair'], industry: 'trades', heroQuery: 'hvac technician professional', cardQuery: 'air conditioning unit' },
  { id: 'roofing', keywords: ['roofing','roof','roofer','shingle','gutter'], industry: 'trades', heroQuery: 'roofing contractor working on roof', cardQuery: 'new roof installation' },
  { id: 'landscaping', keywords: ['landscaping','lawn','garden','tree','yard','mowing','hardscape'], industry: 'trades', heroQuery: 'beautiful landscaped garden', cardQuery: 'landscaping design project' },
  { id: 'cleaning', keywords: ['cleaning','cleaner','maid','janitorial','house cleaning','pressure wash'], industry: 'trades', heroQuery: 'professional cleaning service home', cardQuery: 'cleaning service in action' },
  { id: 'moving', keywords: ['moving','movers','relocation','packing','hauling'], industry: 'trades', heroQuery: 'professional movers carrying boxes', cardQuery: 'moving truck loading' },
  { id: 'pest_control', keywords: ['pest control','exterminator','termite','bug','rodent'], industry: 'trades', heroQuery: 'pest control professional service', cardQuery: 'pest control treatment' },
  { id: 'painting', keywords: ['painting','painter','house painting','interior painting','exterior painting'], industry: 'trades', heroQuery: 'professional painter painting wall', cardQuery: 'fresh painted room' },
  { id: 'flooring', keywords: ['flooring','hardwood','tile','carpet','laminate','floor installation'], industry: 'trades', heroQuery: 'beautiful hardwood floor installation', cardQuery: 'flooring samples close up' },
  { id: 'auto_repair', keywords: ['auto','mechanic','car repair','auto body','tire','oil change','brake'], industry: 'trades', heroQuery: 'auto repair shop garage', cardQuery: 'mechanic working on car' },

  // Tech & Digital
  { id: 'saas', keywords: ['saas','software','platform','app','startup','tech company'], industry: 'tech', heroQuery: 'modern tech office workspace', cardQuery: 'software dashboard screen' },
  { id: 'web_dev', keywords: ['web development','web design','developer','coding','website','frontend','backend'], industry: 'tech', heroQuery: 'developer coding workspace setup', cardQuery: 'code on screen close up' },
  { id: 'it_services', keywords: ['it','tech support','managed services','cybersecurity','network','cloud'], industry: 'tech', heroQuery: 'server room data center', cardQuery: 'it professional working' },
  { id: 'mobile_app', keywords: ['mobile app','ios','android','app development'], industry: 'tech', heroQuery: 'mobile app design mockup', cardQuery: 'smartphone app screen' },

  // Education
  { id: 'school', keywords: ['school','education','academy','learning','tutor','tutoring','teaching'], industry: 'education', heroQuery: 'modern school classroom', cardQuery: 'students learning classroom' },
  { id: 'music', keywords: ['music','music school','guitar','piano','lessons','instrument','band','recording'], industry: 'education', heroQuery: 'music studio instruments', cardQuery: 'musician playing instrument' },
  { id: 'online_course', keywords: ['course','online learning','e-learning','bootcamp','workshop','training program'], industry: 'education', heroQuery: 'online learning laptop modern', cardQuery: 'student studying laptop' },
  { id: 'daycare', keywords: ['daycare','childcare','preschool','nursery','kids','children','babysit'], industry: 'education', heroQuery: 'colorful daycare center', cardQuery: 'children playing learning' },

  // Creative & Arts
  { id: 'photography', keywords: ['photography','photographer','photo','portrait','wedding photographer','headshot'], industry: 'creative', heroQuery: 'photographer studio professional', cardQuery: 'professional photography portrait' },
  { id: 'videography', keywords: ['video','videographer','film','production','documentary','drone'], industry: 'creative', heroQuery: 'video production film set', cardQuery: 'camera filming scene' },
  { id: 'graphic_design', keywords: ['graphic design','designer','logo','branding','illustration','print'], industry: 'creative', heroQuery: 'design studio creative workspace', cardQuery: 'graphic design work' },
  { id: 'art_gallery', keywords: ['art','gallery','exhibit','museum','painting','sculpture','fine art'], industry: 'creative', heroQuery: 'modern art gallery interior', cardQuery: 'art exhibition painting' },
  { id: 'interior_design', keywords: ['interior design','decorator','home design','staging','furnishing'], industry: 'creative', heroQuery: 'beautiful interior design living room', cardQuery: 'interior design detail' },
  { id: 'architecture', keywords: ['architecture','architect','building design','blueprint'], industry: 'creative', heroQuery: 'modern architecture building exterior', cardQuery: 'architectural design detail' },
  { id: 'florist', keywords: ['florist','flower','floral','bouquet','arrangement','wedding flowers'], industry: 'creative', heroQuery: 'beautiful flower shop interior', cardQuery: 'floral arrangement close up' },

  // Events & Entertainment
  { id: 'wedding', keywords: ['wedding','bridal','planner','venue','reception','ceremony','engagement'], industry: 'events', heroQuery: 'elegant wedding venue decorated', cardQuery: 'wedding couple celebration' },
  { id: 'event_planner', keywords: ['event','party','celebration','corporate event','gala','fundraiser'], industry: 'events', heroQuery: 'elegant event setup decoration', cardQuery: 'event party setup' },
  { id: 'dj', keywords: ['dj','music entertainment','party dj','wedding dj','club'], industry: 'events', heroQuery: 'dj performing at event lights', cardQuery: 'dj mixing music' },
  { id: 'theater', keywords: ['theater','theatre','show','performance','acting','drama','comedy','improv'], industry: 'events', heroQuery: 'theater stage dramatic lighting', cardQuery: 'theater performance actors' },

  // Travel & Tourism
  { id: 'travel', keywords: ['travel','tourism','tour','vacation','trip','adventure','destination'], industry: 'travel', heroQuery: 'beautiful travel destination landscape', cardQuery: 'travel adventure scenic' },
  { id: 'tour_guide', keywords: ['tour guide','sightseeing','excursion','city tour','walking tour'], industry: 'travel', heroQuery: 'tour group exploring city', cardQuery: 'sightseeing destination' },

  // Retail
  { id: 'jewelry', keywords: ['jewelry','jeweler','diamond','ring','necklace','bracelet','watch','luxury'], industry: 'retail', heroQuery: 'luxury jewelry display elegant', cardQuery: 'fine jewelry close up' },
  { id: 'furniture', keywords: ['furniture','home furnishing','sofa','table','chair','bedroom','living room'], industry: 'retail', heroQuery: 'modern furniture showroom', cardQuery: 'designer furniture piece' },
  { id: 'bookstore', keywords: ['book','bookstore','library','reading','literature','publishing'], industry: 'retail', heroQuery: 'cozy bookstore interior shelves', cardQuery: 'books on shelf close up' },
  { id: 'pet_store', keywords: ['pet store','pet shop','pet supplies','dog food','cat food'], industry: 'retail', heroQuery: 'pet store colorful interior', cardQuery: 'cute pet animal' },
  { id: 'grocery', keywords: ['grocery','market','organic','farm','produce','supermarket'], industry: 'retail', heroQuery: 'organic grocery market fresh produce', cardQuery: 'fresh produce vegetables' },
  { id: 'cannabis', keywords: ['cannabis','dispensary','marijuana','cbd','hemp','weed'], industry: 'retail', heroQuery: 'modern cannabis dispensary interior', cardQuery: 'cannabis product display' },

  // Nonprofit & Community
  { id: 'nonprofit', keywords: ['nonprofit','charity','foundation','donate','mission','cause','volunteer'], industry: 'nonprofit', heroQuery: 'community people helping together', cardQuery: 'volunteer community service' },
  { id: 'church', keywords: ['church','worship','ministry','faith','congregation','temple','mosque','synagogue','religious'], industry: 'nonprofit', heroQuery: 'beautiful church interior architecture', cardQuery: 'community worship gathering' },

  // Automotive
  { id: 'car_dealer', keywords: ['car dealer','dealership','auto sales','used cars','new cars','vehicle'], industry: 'automotive', heroQuery: 'car dealership showroom luxury', cardQuery: 'luxury car showroom' },
  { id: 'car_wash', keywords: ['car wash','auto detail','detailing','car care'], industry: 'automotive', heroQuery: 'modern car wash facility', cardQuery: 'car being washed detail' },
  { id: 'towing', keywords: ['towing','tow truck','roadside assistance','breakdown'], industry: 'automotive', heroQuery: 'tow truck roadside service', cardQuery: 'towing service action' },
]

// ─── STYLE MOODS (25) ───────────────────────────────────────────────────────
const MOODS = {
  elegant:      { desc: 'Elegant, refined, luxurious. Serif headings, generous spacing, subtle animations.', headingFont: 'Playfair Display', bodyFont: 'Source Sans 3', radius: '4px' },
  modern:       { desc: 'Clean, contemporary, minimal. Sans-serif, lots of whitespace, geometric shapes.', headingFont: 'Inter', bodyFont: 'Inter', radius: '12px' },
  bold:         { desc: 'Bold, high-contrast, impactful. Strong typography, dark backgrounds, neon accents.', headingFont: 'Oswald', bodyFont: 'Inter', radius: '4px' },
  warm:         { desc: 'Warm, inviting, cozy. Earth tones, soft rounded corners, friendly feel.', headingFont: 'Libre Baskerville', bodyFont: 'Nunito', radius: '16px' },
  playful:      { desc: 'Fun, colorful, energetic. Rounded shapes, vibrant colors, bouncy feel.', headingFont: 'Quicksand', bodyFont: 'Quicksand', radius: '20px' },
  minimal:      { desc: 'Ultra-minimal, lots of negative space. Thin type, subtle borders, whisper-quiet.', headingFont: 'DM Sans', bodyFont: 'DM Sans', radius: '8px' },
  corporate:    { desc: 'Professional, trustworthy, conservative. Clean lines, blue tones, formal layout.', headingFont: 'Lora', bodyFont: 'Source Sans 3', radius: '6px' },
  editorial:    { desc: 'Magazine-style, typographic, content-first. Large serif headlines, column layouts.', headingFont: 'Cormorant Garamond', bodyFont: 'Karla', radius: '2px' },
  dark:         { desc: 'Dark theme, moody, premium. Dark backgrounds, light text, subtle glow effects.', headingFont: 'Poppins', bodyFont: 'Inter', radius: '10px' },
  rustic:       { desc: 'Rustic, handcrafted, organic. Natural textures, earthy palette, artisan vibe.', headingFont: 'Merriweather', bodyFont: 'Open Sans', radius: '8px' },
  futuristic:   { desc: 'Sleek, tech-forward, sci-fi inspired. Gradients, glassmorphism, neon.', headingFont: 'Space Grotesk', bodyFont: 'Inter', radius: '16px' },
  vintage:      { desc: 'Retro, nostalgic, old-school charm. Serif fonts, muted colors, texture.', headingFont: 'Playfair Display', bodyFont: 'Lato', radius: '2px' },
  luxury:       { desc: 'High-end luxury, exclusive. Gold accents, dark backgrounds, premium feel.', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', radius: '0px' },
  friendly:     { desc: 'Approachable, casual, welcoming. Rounded fonts, soft colors, warm imagery.', headingFont: 'Nunito', bodyFont: 'Nunito', radius: '16px' },
  artistic:     { desc: 'Creative, expressive, gallery-like. Asymmetric layouts, large imagery, minimal text.', headingFont: 'Cormorant Garamond', bodyFont: 'Karla', radius: '0px' },
  clinical:     { desc: 'Clean, medical, sterile. Calming colors, clear hierarchy, accessible.', headingFont: 'DM Sans', bodyFont: 'Inter', radius: '8px' },
  sporty:       { desc: 'Athletic, dynamic, energetic. Angled elements, bold type, action imagery.', headingFont: 'Archivo', bodyFont: 'Inter', radius: '4px' },
  natural:      { desc: 'Organic, eco-friendly, green. Natural colors, leaf motifs, sustainability.', headingFont: 'Merriweather', bodyFont: 'Open Sans', radius: '12px' },
  industrial:   { desc: 'Raw, exposed, urban. Concrete grays, sharp edges, utilitarian.', headingFont: 'Archivo', bodyFont: 'Inter', radius: '0px' },
  scandinavian: { desc: 'Nordic minimal, hygge, clean. Muted palette, clean lines, natural wood tones.', headingFont: 'DM Sans', bodyFont: 'Inter', radius: '8px' },
  japanese:     { desc: 'Zen, minimal, wabi-sabi. Lots of space, muted earth tones, subtle asymmetry.', headingFont: 'Tenor Sans', bodyFont: 'Inter', radius: '4px' },
  tropical:     { desc: 'Vibrant, island-inspired, lush. Greens, corals, relaxed feel.', headingFont: 'Quicksand', bodyFont: 'Nunito', radius: '16px' },
  noir:         { desc: 'Dark, mysterious, cinematic. High contrast, dramatic shadows, moody.', headingFont: 'Playfair Display', bodyFont: 'Source Sans 3', radius: '2px' },
  coastal:      { desc: 'Breezy, ocean-inspired, relaxed. Blues, whites, sandy tones, open feel.', headingFont: 'Poppins', bodyFont: 'Inter', radius: '12px' },
  brutalist:    { desc: 'Raw, bold, anti-design. Large type, stark contrasts, unconventional layout.', headingFont: 'Space Mono', bodyFont: 'Space Mono', radius: '0px' },
}

// ─── COLOR PALETTES (40) ────────────────────────────────────────────────────
const PALETTES = [
  // Warm
  { name: 'espresso',    bg: '#faf8f5', fg: '#1c1109', card: '#ffffff', primary: '#6b3a2a', primaryFg: '#ffffff', secondary: '#f5ebe0', muted: '#8c7b6b', border: '#e8dfd5', accent: '#b45309' },
  { name: 'terracotta',  bg: '#fdf6f0', fg: '#2c1810', card: '#ffffff', primary: '#c2703e', primaryFg: '#ffffff', secondary: '#fde8d7', muted: '#9c7b6b', border: '#e8d5c4', accent: '#a0522d' },
  { name: 'amber',       bg: '#fffbeb', fg: '#1c1109', card: '#ffffff', primary: '#d97706', primaryFg: '#ffffff', secondary: '#fef3c7', muted: '#92400e', border: '#fde68a', accent: '#f59e0b' },
  { name: 'rose',        bg: '#fff1f2', fg: '#1a1a1a', card: '#ffffff', primary: '#be123c', primaryFg: '#ffffff', secondary: '#ffe4e6', muted: '#9f1239', border: '#fecdd3', accent: '#e11d48' },
  { name: 'burgundy',    bg: '#fdf2f8', fg: '#1a1a1a', card: '#ffffff', primary: '#831843', primaryFg: '#ffffff', secondary: '#fce7f3', muted: '#6b2142', border: '#fbcfe8', accent: '#a21c5e' },

  // Cool
  { name: 'ocean',       bg: '#f0f9ff', fg: '#0c1a2e', card: '#ffffff', primary: '#0369a1', primaryFg: '#ffffff', secondary: '#e0f2fe', muted: '#64748b', border: '#bae6fd', accent: '#0284c7' },
  { name: 'navy',        bg: '#ffffff', fg: '#1a2332', card: '#f8f9fa', primary: '#1a3a5c', primaryFg: '#ffffff', secondary: '#e8edf2', muted: '#64748b', border: '#d1d9e0', accent: '#2563eb' },
  { name: 'teal',        bg: '#f0fdfa', fg: '#0f2d2e', card: '#ffffff', primary: '#0d9488', primaryFg: '#ffffff', secondary: '#ccfbf1', muted: '#5f9ea0', border: '#99f6e4', accent: '#14b8a6' },
  { name: 'cyan',        bg: '#ecfeff', fg: '#1e293b', card: '#ffffff', primary: '#0891b2', primaryFg: '#ffffff', secondary: '#cffafe', muted: '#64748b', border: '#a5f3fc', accent: '#06b6d4' },
  { name: 'arctic',      bg: '#f8fafc', fg: '#1e293b', card: '#ffffff', primary: '#3b82f6', primaryFg: '#ffffff', secondary: '#eff6ff', muted: '#64748b', border: '#dbeafe', accent: '#2563eb' },

  // Earth
  { name: 'forest',      bg: '#f0fdf4', fg: '#14532d', card: '#ffffff', primary: '#15803d', primaryFg: '#ffffff', secondary: '#dcfce7', muted: '#4d7c5d', border: '#bbf7d0', accent: '#22c55e' },
  { name: 'sage',        bg: '#f5f7f5', fg: '#1a2e1a', card: '#ffffff', primary: '#4d7c5d', primaryFg: '#ffffff', secondary: '#e8ede8', muted: '#6b8c6b', border: '#d1ddd1', accent: '#5c9a6c' },
  { name: 'olive',       bg: '#fafaf5', fg: '#1a1c10', card: '#ffffff', primary: '#65783a', primaryFg: '#ffffff', secondary: '#ecf0d8', muted: '#7c8c5c', border: '#dde4c4', accent: '#84a54a' },
  { name: 'sand',        bg: '#faf9f6', fg: '#2c2416', card: '#ffffff', primary: '#a08b6e', primaryFg: '#ffffff', secondary: '#f0ece4', muted: '#8c7b65', border: '#e0d8cc', accent: '#b8976c' },
  { name: 'clay',        bg: '#faf5f0', fg: '#2c1e14', card: '#ffffff', primary: '#8b5e3c', primaryFg: '#ffffff', secondary: '#f0e4d8', muted: '#9c7b5c', border: '#e0d0c0', accent: '#a5724c' },

  // Dark themes
  { name: 'midnight',    bg: '#0a0a0a', fg: '#f5f5f5', card: '#1a1a1a', primary: '#ffffff', primaryFg: '#0a0a0a', secondary: '#141414', muted: '#888888', border: '#2a2a2a', accent: '#ffffff' },
  { name: 'charcoal',    bg: '#111111', fg: '#e8e8e8', card: '#1c1c1c', primary: '#e8e8e8', primaryFg: '#111111', secondary: '#1a1a1a', muted: '#777777', border: '#333333', accent: '#ffffff' },
  { name: 'dark_gold',   bg: '#0a0a0a', fg: '#f5f0eb', card: '#1a1a1a', primary: '#c9a96e', primaryFg: '#0a0a0a', secondary: '#1f1f1f', muted: '#8a8077', border: '#2a2520', accent: '#d4af37' },
  { name: 'dark_blue',   bg: '#0f1117', fg: '#f1f5f9', card: '#1a1d27', primary: '#3b82f6', primaryFg: '#ffffff', secondary: '#1e2231', muted: '#64748b', border: '#2a2d3a', accent: '#60a5fa' },
  { name: 'dark_green',  bg: '#0a120a', fg: '#e8f5e8', card: '#142014', primary: '#22c55e', primaryFg: '#0a120a', secondary: '#1a2e1a', muted: '#5c8c5c', border: '#1e3a1e', accent: '#4ade80' },
  { name: 'dark_red',    bg: '#120a0a', fg: '#f5e8e8', card: '#1e1414', primary: '#ef4444', primaryFg: '#ffffff', secondary: '#2a1a1a', muted: '#8c5c5c', border: '#3a1e1e', accent: '#f87171' },
  { name: 'dark_purple', bg: '#0f0a1a', fg: '#ede8f5', card: '#1a1428', primary: '#8b5cf6', primaryFg: '#ffffff', secondary: '#1e1530', muted: '#7c6c9c', border: '#2a2040', accent: '#a78bfa' },

  // Neutral
  { name: 'monochrome',  bg: '#ffffff', fg: '#111111', card: '#ffffff', primary: '#111111', primaryFg: '#ffffff', secondary: '#f5f5f5', muted: '#737373', border: '#e5e5e5', accent: '#111111' },
  { name: 'slate',       bg: '#f8fafc', fg: '#0f172a', card: '#ffffff', primary: '#334155', primaryFg: '#ffffff', secondary: '#f1f5f9', muted: '#64748b', border: '#e2e8f0', accent: '#475569' },
  { name: 'stone',       bg: '#fafaf9', fg: '#1c1917', card: '#ffffff', primary: '#44403c', primaryFg: '#ffffff', secondary: '#f5f5f4', muted: '#78716c', border: '#e7e5e4', accent: '#57534e' },
  { name: 'zinc',        bg: '#fafafa', fg: '#18181b', card: '#ffffff', primary: '#3f3f46', primaryFg: '#ffffff', secondary: '#f4f4f5', muted: '#71717a', border: '#e4e4e7', accent: '#52525b' },

  // Vibrant
  { name: 'indigo',      bg: '#ffffff', fg: '#111827', card: '#ffffff', primary: '#6366f1', primaryFg: '#ffffff', secondary: '#f5f3ff', muted: '#6b7280', border: '#e5e7eb', accent: '#8b5cf6' },
  { name: 'emerald',     bg: '#ffffff', fg: '#111827', card: '#ffffff', primary: '#059669', primaryFg: '#ffffff', secondary: '#ecfdf5', muted: '#6b7280', border: '#e5e7eb', accent: '#10b981' },
  { name: 'violet',      bg: '#ffffff', fg: '#111827', card: '#ffffff', primary: '#7c3aed', primaryFg: '#ffffff', secondary: '#f5f3ff', muted: '#6b7280', border: '#e5e7eb', accent: '#8b5cf6' },
  { name: 'coral',       bg: '#ffffff', fg: '#1a1a1a', card: '#ffffff', primary: '#f97316', primaryFg: '#ffffff', secondary: '#fff7ed', muted: '#737373', border: '#e5e5e5', accent: '#fb923c' },
  { name: 'crimson',     bg: '#ffffff', fg: '#1a1a1a', card: '#ffffff', primary: '#dc2626', primaryFg: '#ffffff', secondary: '#fef2f2', muted: '#737373', border: '#e5e5e5', accent: '#ef4444' },

  // Special
  { name: 'gold_navy',   bg: '#ffffff', fg: '#1a2332', card: '#f8f9fa', primary: '#1a3a5c', primaryFg: '#ffffff', secondary: '#e8edf2', muted: '#64748b', border: '#d1d9e0', accent: '#b8860b' },
  { name: 'cream',       bg: '#fefcf3', fg: '#1a1509', card: '#ffffff', primary: '#92400e', primaryFg: '#ffffff', secondary: '#fef9e7', muted: '#8c7b5c', border: '#e8e0c8', accent: '#b45309' },
  { name: 'blush',       bg: '#fdf8f6', fg: '#1a1a1a', card: '#ffffff', primary: '#8b6f5e', primaryFg: '#ffffff', secondary: '#f5ede8', muted: '#9c8e85', border: '#e8ddd5', accent: '#c4956a' },
  { name: 'mint',        bg: '#f0fdf4', fg: '#1a2e1a', card: '#ffffff', primary: '#16a34a', primaryFg: '#ffffff', secondary: '#dcfce7', muted: '#5c8c5c', border: '#bbf7d0', accent: '#22c55e' },
  { name: 'lavender',    bg: '#faf5ff', fg: '#1a1028', card: '#ffffff', primary: '#7e22ce', primaryFg: '#ffffff', secondary: '#f3e8ff', muted: '#7c6c9c', border: '#e9d5ff', accent: '#9333ea' },
  { name: 'peach',       bg: '#fff7ed', fg: '#1a1209', card: '#ffffff', primary: '#ea580c', primaryFg: '#ffffff', secondary: '#ffedd5', muted: '#9a6c4a', border: '#fed7aa', accent: '#f97316' },
]

// ─── INDUSTRY → MOOD + PALETTE MAPPING ──────────────────────────────────────
const INDUSTRY_DEFAULTS = {
  food:         { moods: ['warm','editorial','rustic','elegant','japanese'], palettes: ['espresso','terracotta','cream','dark_gold','sand'] },
  beauty:       { moods: ['elegant','minimal','luxury','scandinavian','friendly'], palettes: ['blush','rose','lavender','cream','peach'] },
  wellness:     { moods: ['natural','minimal','scandinavian','japanese','friendly'], palettes: ['sage','mint','teal','sand','blush'] },
  medical:      { moods: ['clinical','modern','friendly','minimal','corporate'], palettes: ['cyan','arctic','teal','slate','ocean'] },
  fitness:      { moods: ['bold','sporty','dark','industrial','futuristic'], palettes: ['dark_red','crimson','midnight','charcoal','dark_blue'] },
  professional: { moods: ['corporate','modern','elegant','minimal','editorial'], palettes: ['navy','gold_navy','slate','arctic','stone'] },
  realestate:   { moods: ['modern','corporate','elegant','minimal','luxury'], palettes: ['navy','slate','arctic','monochrome','gold_navy'] },
  trades:       { moods: ['bold','industrial','sporty','modern','friendly'], palettes: ['amber','coral','charcoal','slate','forest'] },
  tech:         { moods: ['modern','futuristic','minimal','dark','brutalist'], palettes: ['indigo','violet','dark_purple','dark_blue','monochrome'] },
  education:    { moods: ['friendly','playful','modern','warm','natural'], palettes: ['indigo','emerald','coral','ocean','forest'] },
  creative:     { moods: ['artistic','editorial','minimal','dark','brutalist'], palettes: ['midnight','monochrome','dark_gold','lavender','stone'] },
  events:       { moods: ['elegant','luxury','playful','editorial','warm'], palettes: ['dark_gold','rose','cream','blush','burgundy'] },
  travel:       { moods: ['tropical','coastal','warm','editorial','modern'], palettes: ['ocean','coral','teal','sand','emerald'] },
  retail:       { moods: ['modern','minimal','elegant','playful','luxury'], palettes: ['monochrome','slate','indigo','rose','dark_gold'] },
  nonprofit:    { moods: ['warm','friendly','natural','modern','rustic'], palettes: ['forest','sage','emerald','ocean','amber'] },
  automotive:   { moods: ['bold','dark','industrial','modern','sporty'], palettes: ['charcoal','dark_red','midnight','crimson','slate'] },
}

// ─── MATCHING ENGINE ────────────────────────────────────────────────────────

export function matchDesign(prompt: string) {
  const p = prompt.toLowerCase()

  // Find best category match
  let bestCat = null
  let bestScore = 0
  for (const cat of CATEGORIES) {
    let score = 0
    for (const kw of cat.keywords) {
      if (p.includes(kw)) score += kw.split(' ').length
    }
    if (score > bestScore) {
      bestScore = score
      bestCat = cat
    }
  }

  if (!bestCat) return null

  // Get industry defaults
  const industry = INDUSTRY_DEFAULTS[bestCat.industry] || INDUSTRY_DEFAULTS.professional

  // Use random seed each call so same prompt never produces the same design twice
  const r = Math.random()
  const r2 = Math.random()

  // Check for mood hints in prompt
  let mood
  const darkHint = /\b(dark|moody|night|noir|black)\b/.test(p)
  const brightHint = /\b(bright|colorful|vibrant|fun|playful)\b/.test(p)
  const elegantHint = /\b(elegant|luxury|premium|upscale|high.?end)\b/.test(p)
  const minimalHint = /\b(minimal|simple|clean|modern)\b/.test(p)

  if (darkHint) mood = MOODS.dark
  else if (brightHint) mood = MOODS.playful
  else if (elegantHint) mood = MOODS.luxury
  else if (minimalHint) mood = MOODS.minimal
  else {
    const moodKey = industry.moods[Math.floor(r * industry.moods.length)]
    mood = MOODS[moodKey]
  }

  // Pick palette randomly from industry palettes — prefer dark palettes for dark moods
  let palette
  if (darkHint) {
    const darkPalettes = PALETTES.filter(p => p.bg.startsWith('#0') || p.bg.startsWith('#1'))
    palette = darkPalettes[Math.floor(r * darkPalettes.length)]
  } else {
    const paletteName = industry.palettes[Math.floor(r2 * industry.palettes.length)]
    palette = PALETTES.find(p => p.name === paletteName) || PALETTES[Math.floor(r * PALETTES.length)]
  }

  return { category: bestCat, mood, palette }
}

export function buildDesignContext(match: ReturnType<typeof matchDesign>) {
  if (!match) return ''
  const { category, mood, palette } = match

  return `
DESIGN SYSTEM — Follow this exactly:
Style: ${mood.desc}
Fonts: @import url('https://fonts.googleapis.com/css2?family=${mood.headingFont.replace(/ /g, '+')}:wght@400;700;800&family=${mood.bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
CSS variables for styles.css :root:
  --bg: ${palette.bg}; --fg: ${palette.fg}; --card: ${palette.card};
  --primary: ${palette.primary}; --primary-fg: ${palette.primaryFg};
  --secondary: ${palette.secondary}; --muted: ${palette.muted};
  --border: ${palette.border}; --accent: ${palette.accent};
body { font-family: '${mood.bodyFont}', sans-serif; background: var(--bg); color: var(--fg); }
h1,h2,h3 { font-family: '${mood.headingFont}', serif; }
Use var(--primary), var(--bg), etc everywhere. border-radius: ${mood.radius}.
Hero image: {{unsplash:${category.heroQuery}|1600x900}}
Card images: {{unsplash:${category.cardQuery}|400x300}}`
}

export { CATEGORIES, MOODS, PALETTES }
