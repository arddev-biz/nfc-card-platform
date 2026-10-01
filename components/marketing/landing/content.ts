// Marketing content is independent of subscription entitlements and profile storage.
// No approved prices or customer endorsements are currently configured.
export const navigation = [
  { label: "Home", href: "#home" }, { label: "Features", href: "#features" },
  { label: "Examples", href: "#examples" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" },
];
export const packages = [{
  name: "NFC Card + Profile", label: "YOUR BUSINESS, CONNECTED", price: "Let’s talk.",
  description: "One connected starting point for your business. Ask us for current pricing and a setup that fits.",
  included: ["1 NFC business card", "Customizable digital business profile", "Social, contact and review links", "Digital menu for restaurants and cafés", "Profile updates without replacing your card", "1 year of platform access and support"],
}];
export const faqs = [
  { question: "How does the NFC card work?", answer: "Hold the card near the NFC reader of a compatible smartphone. The phone offers a link to your business profile, which opens in its browser. NFC availability and reader position depend on the phone." },
  { question: "Do customers need an app?", answer: "No. Customers view your digital profile in their phone’s browser, with no AuraLink app to install." },
  { question: "Can my profile be updated after I receive the card?", answer: "Yes. Business details, links, images and menu content can be updated through the platform. Your existing card continues to point to the same profile." },
  { question: "Does the QR code open the same profile?", answer: "Yes. A QR code linked to your profile gives customers another way to open it, including on phones that do not support NFC." },
  { question: "Can I share social media, my website and Google Reviews?", answer: "Yes. Your profile can bring together social links, your website, contact actions and a link to your Google Reviews page. You choose which supported content is shown." },
  { question: "Can restaurants add a digital menu?", answer: "Yes. The digital menu supports categories, items and prices, so customers can explore your menu from your profile." },
  { question: "What happens after the included service period?", answer: "The current package includes one year of platform access and support. Contact us to confirm the ongoing service terms and pricing before ordering." },
];
export const demos = [
  { name: "Oliva", category: "Restaurant", theme: "restaurant", monogram: "O", tagline: "Good food. Great company.", actions: ["Explore our menu", "Book a table", "Leave a review", "Get directions"] },
  { name: "The Cut", category: "Barber shop", theme: "barber", monogram: "TC", tagline: "A sharper kind of confidence.", actions: ["Book your appointment", "Our services", "Find your style", "Contact the studio"] },
  { name: "Bloom", category: "Café", theme: "cafe", monogram: "b.", tagline: "A little pause. A better day.", actions: ["The coffee menu", "Something sweet", "Find our café", "Follow along"] },
  { name: "FORM", category: "Fitness studio", theme: "gym", monogram: "F", tagline: "Make room for your next level.", actions: ["Explore classes", "Meet the coaches", "Find the studio", "Get in touch"] },
] as const;
export type Demo = typeof demos[number];
