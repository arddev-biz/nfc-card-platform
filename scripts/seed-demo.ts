/**
 * Seeds (idempotently) a single realistic premium restaurant so the
 * public profile 2.0 / menu redesign can be viewed live at
 * /<demo-slug>. Re-running replaces the demo profile, links and menu
 * with a clean copy — it never touches any other organization.
 *
 * Usage:
 *   npm run seed-demo
 *
 * The slug comes from NEXT_PUBLIC_DEMO_BUSINESS_SLUG when set (so the
 * marketing "view demo" link resolves), falling back to "lumiere".
 */
import { db } from "../lib/db";
import { toMinorUnits } from "../lib/currency";

const SLUG = process.env.NEXT_PUBLIC_DEMO_BUSINESS_SLUG?.trim() || "lumiere";
const THEME = "#C6A15B"; // champagne gold

async function main() {
  const organization = await db.organization.upsert({
    where: { slug: SLUG },
    update: { name: "Lumière", businessType: "Restaurant", status: "ACTIVE" },
    create: { slug: SLUG, name: "Lumière", businessType: "Restaurant", status: "ACTIVE" },
  });

  const profile = await db.businessProfile.upsert({
    where: { organizationId: organization.id },
    update: {
      displayName: "Lumière",
      bio: "A candlelit dining room where seasonal ingredients meet quiet luxury. Reservations recommended.",
      logoUrl: "/demo/logo.png",
      coverImageUrl: "/demo/cover.png",
      themeColor: THEME,
      phone: "+355 69 555 0142",
      whatsapp: "+355 69 555 0142",
      email: "reservations@lumiere.example",
      website: "https://lumiere.example",
      address: "Rruga Pjetër Bogdani 12, Tirana",
      googleMapsUrl: "https://maps.google.com/?q=Tirana",
      backgroundType: "IMAGE",
      backgroundImageUrl: "/demo/background.png",
      backgroundMode: "DARK",
      backgroundColor: null,
      backgroundGradient: null,
    },
    create: {
      organizationId: organization.id,
      displayName: "Lumière",
      bio: "A candlelit dining room where seasonal ingredients meet quiet luxury. Reservations recommended.",
      logoUrl: "/demo/logo.png",
      coverImageUrl: "/demo/cover.png",
      themeColor: THEME,
      phone: "+355 69 555 0142",
      whatsapp: "+355 69 555 0142",
      email: "reservations@lumiere.example",
      website: "https://lumiere.example",
      address: "Rruga Pjetër Bogdani 12, Tirana",
      googleMapsUrl: "https://maps.google.com/?q=Tirana",
      backgroundType: "IMAGE",
      backgroundImageUrl: "/demo/background.png",
      backgroundMode: "DARK",
    },
  });

  // Links — reset then recreate so re-runs stay clean.
  await db.profileLink.deleteMany({ where: { businessProfileId: profile.id } });
  await db.profileLink.createMany({
    data: [
      { businessProfileId: profile.id, type: "INSTAGRAM", label: "Instagram", url: "https://instagram.com/lumiere", sortOrder: 0 },
      { businessProfileId: profile.id, type: "FACEBOOK", label: "Facebook", url: "https://facebook.com/lumiere", sortOrder: 1 },
      { businessProfileId: profile.id, type: "BOOKING", label: "Reserve a Table", url: "https://lumiere.example/reserve", sortOrder: 2 },
      { businessProfileId: profile.id, type: "WEBSITE", label: "Visit our Website", url: "https://lumiere.example", sortOrder: 3 },
      { businessProfileId: profile.id, type: "WHATSAPP", label: "WhatsApp", url: "+355 69 555 0142", sortOrder: 4 },
      { businessProfileId: profile.id, type: "GOOGLE_MAPS", label: "Google Maps", url: "https://maps.google.com/?q=Tirana", sortOrder: 5 },
      { businessProfileId: profile.id, type: "GOOGLE_REVIEWS", label: "Leave us a Google Review", url: "https://g.page/r/lumiere/review", sortOrder: 6 },
    ],
  });

  // Enable the MENU module.
  await db.businessModule.upsert({
    where: { organizationId_type: { organizationId: organization.id, type: "MENU" } },
    update: { isEnabled: true },
    create: { organizationId: organization.id, type: "MENU", isEnabled: true },
  });

  // Menu — delete (cascades categories + items) then recreate.
  await db.menu.deleteMany({ where: { organizationId: organization.id } });
  const eur = (amount: number) => toMinorUnits(amount, "EUR");

  await db.menu.create({
    data: {
      organizationId: organization.id,
      name: "Dinner Menu",
      description: "Served nightly from 18:00. Our kitchen is happy to accommodate dietary needs.",
      isActive: true,
      categories: {
        create: [
          {
            name: "To Begin",
            description: "Small plates to open the evening",
            sortOrder: 0,
            isActive: true,
            items: {
              create: [
                { name: "Oysters & Champagne Mignonette", description: "Half dozen, cucumber, dill", priceMinor: eur(18), currency: "EUR", sortOrder: 0, isActive: true },
                { name: "Burrata & Heirloom Tomato", description: "Basil oil, aged balsamic, sea salt", priceMinor: eur(14), currency: "EUR", sortOrder: 1, isActive: true },
                { name: "Steak Tartare", description: "Hand-cut beef, capers, quail yolk, toasted brioche", priceMinor: eur(16), currency: "EUR", sortOrder: 2, isActive: true },
                { name: "Wild Mushroom Velouté", description: "Truffle cream, chive oil", priceMinor: eur(12), currency: "EUR", sortOrder: 3, isActive: true },
              ],
            },
          },
          {
            name: "Mains",
            description: "From the pass",
            sortOrder: 1,
            isActive: true,
            items: {
              create: [
                { name: "Roasted Duck Breast", description: "Blackberry jus, glazed heritage carrots, parsnip purée", priceMinor: eur(32), currency: "EUR", sortOrder: 0, isActive: true },
                { name: "Line-Caught Sea Bass", description: "Fennel, brown butter, saffron", priceMinor: eur(29), currency: "EUR", sortOrder: 1, isActive: true },
                { name: "Dry-Aged Ribeye", description: "40-day aged, bone marrow, triple-cooked chips", priceMinor: eur(38), currency: "EUR", sortOrder: 2, isActive: true },
                { name: "Wild Mushroom Risotto", description: "Aged parmesan, truffle, thyme", priceMinor: eur(24), currency: "EUR", sortOrder: 3, isActive: true },
              ],
            },
          },
          {
            name: "Desserts",
            description: "To close",
            sortOrder: 2,
            isActive: true,
            items: {
              create: [
                { name: "Dark Chocolate Fondant", description: "Salted caramel, crème fraîche", priceMinor: eur(11), currency: "EUR", sortOrder: 0, isActive: true },
                { name: "Vanilla Crème Brûlée", description: "Tahitian vanilla, shortbread", priceMinor: eur(10), currency: "EUR", sortOrder: 1, isActive: true },
                { name: "Selection of Aged Cheeses", description: "Quince, honeycomb, walnut crackers", priceMinor: eur(15), currency: "EUR", sortOrder: 2, isActive: true },
              ],
            },
          },
          {
            name: "Wine & Cocktails",
            description: "By the glass",
            sortOrder: 3,
            isActive: true,
            items: {
              create: [
                { name: "House Champagne", description: "Brut, France", priceMinor: eur(14), currency: "EUR", sortOrder: 0, isActive: true },
                { name: "Barrel-Aged Negroni", description: "Gin, Campari, sweet vermouth", priceMinor: eur(13), currency: "EUR", sortOrder: 1, isActive: true },
                { name: "Sommelier's Red", description: "Ask your server for tonight's pour", priceMinor: eur(12), currency: "EUR", sortOrder: 2, isActive: true },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Demo restaurant ready at /${SLUG}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed demo restaurant:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
