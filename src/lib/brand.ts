export const brand = {
  name: "Vinaroda",
  tagline: "Find it. Love it. Get it.",
  subTagline: "Your store. Your everything.",
  heroHeadline: "Discover something new every day.",
  heroSubhead:
    "Fashion. Beauty. Home. Tech. Everything - at prices you'll love.",
  trustItems: [
    { title: "Free Shipping", body: "On qualifying orders" },
    { title: "Easy Returns", body: "30-day return policy" },
    { title: "Secure Checkout", body: "SSL encrypted payments" },
    { title: "Real Support", body: "We're here when you need us" },
  ],
} as const;

export const categoryCopy: Record<
  string,
  { label: string; description: string }
> = {
  women: {
    label: "Style & Clothing",
    description: "Outfits for every mood, every season, every you.",
  },
  men: {
    label: "Style & Clothing",
    description: "Everyday staples and polished picks that keep it easy.",
  },
  home: {
    label: "Home & Living",
    description: "Make your space feel like yours.",
  },
  beauty: {
    label: "Beauty & Skincare",
    description: "Glow up. Your routine, upgraded.",
  },
  electronics: {
    label: "Tech & Gadgets",
    description: "Smarter tools for everyday life.",
  },
  accessories: {
    label: "Bags, Jewelry & More",
    description: "The details that finish the look.",
  },
  kids: {
    label: "Kids & Baby",
    description: "Everything little ones need to grow and play.",
  },
  sports: {
    label: "Sports & Outdoors",
    description: "Gear that keeps up with you.",
  },
  deals: {
    label: "Today's Deals",
    description: "The best prices, right now. Updated daily.",
  },
};

export function getCategoryCopy(slug: string, fallbackName: string) {
  return (
    categoryCopy[slug] ?? {
      label: fallbackName,
      description: "Discover fresh finds in one place.",
    }
  );
}
