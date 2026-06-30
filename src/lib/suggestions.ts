// Generates contextual next-action suggestions based on what was built

export interface Suggestion {
  label: string;     // Short button text: "Add dark mode"
  prompt: string;    // Full prompt to send when clicked
  icon: string;      // emoji
}

export function generateSuggestions(
  files: Record<string, string>,
  originalPrompt: string
): Suggestion[] {
  const app = files['/App.tsx'] || '';
  const css = files['/index.css'] || '';
  const suggestions: Suggestion[] = [];
  const promptLower = originalPrompt.toLowerCase();

  // Detect what's already in the site
  const hasBooking = app.includes('<Booking') || app.includes('Booking');
  const hasShop = app.includes('<ShopGrid') || app.includes('ShopGrid');
  const hasMenu = app.includes('<MenuGrid') || app.includes('MenuGrid');
  const hasPricing = app.includes('<PricingTable') || app.includes('PricingTable');
  const hasBlog = app.includes('<BlogGrid') || app.includes('BlogGrid');
  const hasReviews = app.includes('<Reviews') || app.includes('<Testimonials');
  const hasDark = css.includes('#0') || css.includes('dark') || (css.match(/--bg:\s*#[0-3]/) !== null);
  const hasNewsletter = app.includes('<Newsletter') || app.includes('Newsletter');
  const hasContact = app.includes('<Contact') || app.includes('Contact');
  const hasGallery = app.includes('<Gallery') || app.includes('Gallery');
  const hasTeam = app.includes('<Team') || app.includes('Team');
  const hasFAQ = app.includes('<FAQ') || app.includes('FAQ');

  // Suggest what's missing and would benefit the business type
  if (!hasBooking && (promptLower.includes('salon') || promptLower.includes('spa') || promptLower.includes('doctor') || promptLower.includes('dental') || promptLower.includes('gym') || promptLower.includes('trainer') || promptLower.includes('restaurant'))) {
    suggestions.push({ icon: '📅', label: 'Add booking', prompt: 'Add a booking/reservation section with date and time picker' });
  }

  if (!hasPricing && (promptLower.includes('saas') || promptLower.includes('app') || promptLower.includes('software') || promptLower.includes('gym') || promptLower.includes('trainer') || promptLower.includes('spa'))) {
    suggestions.push({ icon: '💳', label: 'Add pricing', prompt: 'Add a pricing table with 3 tiers: Starter, Pro, and Enterprise' });
  }

  if (!hasReviews) {
    suggestions.push({ icon: '⭐', label: 'Add reviews', prompt: 'Add a reviews/testimonials section with real-looking 5-star reviews' });
  }

  if (!hasFAQ) {
    suggestions.push({ icon: '❓', label: 'Add FAQ', prompt: 'Add a FAQ section with 6 common questions and answers relevant to this business' });
  }

  if (!hasNewsletter && !hasShop) {
    suggestions.push({ icon: '📧', label: 'Add email signup', prompt: 'Add an email newsletter signup section with a compelling offer' });
  }

  if (!hasDark) {
    suggestions.push({ icon: '🌙', label: 'Dark mode version', prompt: 'Convert this site to a dark color scheme with deep navy/black backgrounds and bright accent colors' });
  }

  if (!hasGallery && (promptLower.includes('salon') || promptLower.includes('restaurant') || promptLower.includes('gym') || promptLower.includes('photographer') || promptLower.includes('contractor'))) {
    suggestions.push({ icon: '🖼️', label: 'Add gallery', prompt: 'Add a photo gallery section showcasing our work and space' });
  }

  if (!hasTeam && !promptLower.includes('saas') && !promptLower.includes('shop')) {
    suggestions.push({ icon: '👥', label: 'Add team section', prompt: 'Add a meet the team section with 4 team members, their roles and short bios' });
  }

  if (hasShop) {
    suggestions.push({ icon: '🛒', label: 'Add cart to nav', prompt: 'Make sure the navbar shows a cart icon with item count that opens the cart drawer' });
  }

  if (!hasContact) {
    suggestions.push({ icon: '📞', label: 'Add contact form', prompt: 'Add a contact section with form, phone number, email, and business hours' });
  }

  // Always offer style options
  suggestions.push({ icon: '✨', label: 'Make it pop more', prompt: 'Make the design more bold and eye-catching: bigger hero text, more vibrant colors, stronger contrast, more visual hierarchy' });
  suggestions.push({ icon: '🔤', label: 'Add more content', prompt: 'Expand the site with more detailed content: more specific descriptions, additional sections, and richer data for each section' });

  // Return top 5 most relevant
  return suggestions.slice(0, 5);
}
