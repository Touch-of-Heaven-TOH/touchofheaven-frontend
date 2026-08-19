export type ShowcaseSlide = {
  image: string;
  alt: string;
  heading: string;
  description: string;
};

export const showcaseSlides: ShowcaseSlide[] = [
  {
    image: "/images/home/images/pic1.png",
    alt: "Calendar view showing upcoming appointments",
    heading: "Stay booked, without the back and forth",
    description:
      "Keep your calendar full and build a loyal clientele with 24/7 easy online booking, automated marketing tools, and more visibility for your business.",
  },
  {
    image: "/images/home/images/pic2.png",
    alt: "Client reviewing appointment details",
    heading: "Break free from busywork, focus on your clients",
    description:
      "Keep total control of what's important, but don't sweat the small stuff. Streamline the admin and focus on creating an unforgettable experience for your clients.",
  },
];

export type MarketplaceSlide ={
  id: string;
   image: string;
   alt: string;
   heading: string;
   label: string;
   
}

export const MarketplaceSlides: MarketplaceSlide[] = [
  {
    id: "slide1",
    image: "/images/home/images/hairoil.png",
    alt: "Marketplace view showing products for sale",
    heading: "Buy, sell, and stock up — all in one place.",
    label: "",
    
  },
  {
    id: "slide2",
    image: "/images/home/images/grocries.png",
    alt: "Seller managing their product listings",
    heading: "Sell your products with ease and confidence.",
    label: "",
   
  },
  {
    id: "slide3",
    image: "/images/home/images/edit1.jpg",
    alt: "Buyer viewing product details",
    heading: "Find the right products for your needs.",
    label: "",
  }, 
  {
    id: "slide4",
    image: "/images/home/images/bobolo.png",
    alt: "Marketplace view showing customer reviews",
    heading: "Build trust with verified customer reviews.",
    label: "",
    
  },
  {
    id: "slide5",
    image: "/images/home/images/spice1.png",
    alt: "Seller analyzing sales data",
    heading: "Gain insights to grow your business.",
    label: "",
    
  },
  {
    id: "slide6",
    image: "/images/home/images/brandedSpices.png",
    alt: "Marketplace view showing featured products",
    heading: "Showcase your products to a wider audience.",
    label: "",
    
  }
]

export type FeatureSlide = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  alt: string;
};

export const featureShowcaseSlides: FeatureSlide[] = [
  {
    id: "no-cost-setup",
    title: "No fees to get started, ever",
    description:"Other booking platforms charge braiders a monthly fee or take a commission on every service. Here, listing your services and taking bookings costs nothing — you keep what you earn.",
    ctaLabel: "Create your profile",
    ctaHref: "/sign-up",
    // IMAGE NEEDED: illustration works better than a screenshot here — a simple
    // "$0" badge or a wallet/checkmark graphic. There's no UI screen that visually
    // represents "absence of a fee," so don't force one.
    image: "/images/home/images/platform.png",
    alt: "No fees to join as a braider",
  },
  {
    id: "ai-style-preview",
    title: "See your braid before you book",
    description: "Upload a photo and preview AI-suggested braid styles matched to your face shape and the occasion.",
    ctaLabel: "Try AI Style Preview",
    ctaHref: "/ai-studio",
    // IMAGE NEEDED: a single "after" result photo works fine here (before/after split
    // was the old AiStylePreviewSection's job — don't rebuild that complexity unless you want it back).
    image: "/images/home/images/Aistyle.png",
    alt: "AI-suggested braid style preview",
  },
  {
    id: "calendar",
    title: "Calendar & Appointments",
    description:"Streamline bookings while keeping full control of your calendar. Clients get automatic reminders — fully customizable.",
    ctaLabel: "Learn more about Calendar",
    ctaHref: "/features/calendar",
    // IMAGE NEEDED: phone-mockup screenshot of your actual calendar/appointments screen (like the Booksy reference).
    image: "/images/home/images/schudle.png",
    alt: "Calendar and appointments screen",
  },
  {
    id: "marketplace",
    title: "Shop while you book",
    description:
      "Buy verified hair products and groceries from trusted sellers — all inside the same app you use to book your braider.",
    ctaLabel: "Explore marketplace",
    ctaHref: "/marketplace",
    // IMAGE NEEDED: product grid screenshot, or a styled flat-lay photo of hair products + grocery items together.
    image: "/images/home/images/prodgrocrey.png",
    alt: "Marketplace product listings",
  }
];