export type DiscoveryImage = {
  src: string;
  alt: string;
  position?: string;
};

export type DiscoveryCategory = {
  id: string;
  label: string;
  image: DiscoveryImage;
  href: string;
};

export type DiscoveryService = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  price: number;
  deposit: number;
  duration: string;
  nextAvailability: string;
  image: DiscoveryImage;
  gallery: DiscoveryImage[];
  included: string[];
  preparation: string;
  aftercare: string;
  materials: string;
  cancellation: string;
  sizes: string[];
  selectedSize: string;
  lengths: string[];
  selectedLength: string;
};

export type DiscoveryProfessional = {
  slug: string;
  name: string;
  businessName: string;
  category: string;
  title: string;
  location: string;
  neighborhood: string;
  distance: string;
  rating: number;
  reviews: number;
  respondsIn: string;
  startingPrice: number;
  nextAvailability: string;
  verified: boolean;
  image: DiscoveryImage;
  coverImage: DiscoveryImage;
  portfolio: Array<DiscoveryImage & { label: string; serviceSlug: string; category: string }>;
  specialties: string[];
  amenities: string[];
  languages: string[];
  hours: Array<[string, string]>;
  services: DiscoveryService[];
  reviewsList: Array<{
    initials: string;
    name: string;
    date: string;
    service: string;
    rating: number;
    body: string;
    image?: DiscoveryImage;
    response?: {
      body: string;
      date: string;
    };
  }>;
  credentials: Array<{
    title: string;
    status: string;
    detail: string;
    kind: "verified" | "neutral";
    facts?: string[];
  }>;
};

const imageBase = "/images/home/images";
const studioBase = "/images/ai-studio/catalog";

export const discoveryCategories: DiscoveryCategory[] = [
  {
    id: "braids-hair",
    label: "Braids & Hair",
    href: "/businesses?category=braids-hair",
    image: {
      src: `${studioBase}/knotless-small-midback-front.jpg`,
      alt: "A polished braided hairstyle in a warm salon.",
      position: "center 34%",
    },
  },
  {
    id: "nails",
    label: "Nails",
    href: "/businesses?category=nails",
    image: {
      src: `${imageBase}/pic1.png`,
      alt: "A clean manicure detail in a beauty studio.",
      position: "center 45%",
    },
  },
  {
    id: "barbering",
    label: "Barbering",
    href: "/businesses?category=barbering",
    image: {
      src: `${imageBase}/pic2.png`,
      alt: "A barber grooming a client in a modern studio.",
      position: "center 38%",
    },
  },
  {
    id: "spa-wellness",
    label: "Spa & Wellness",
    href: "/businesses?category=spa-wellness",
    image: {
      src: `${imageBase}/hero2.jpg`,
      alt: "A relaxing wellness appointment in a calm treatment room.",
      position: "center 42%",
    },
  },
];

const amaraGallery: DiscoveryService["gallery"] = [
  {
    src: `${studioBase}/knotless-small-midback-front.jpg`,
    alt: "Medium knotless braids from the front.",
    position: "center 32%",
  },
  {
    src: `${studioBase}/knotless-small-midback-back.jpg`,
    alt: "Medium knotless braids from the back.",
    position: "center 30%",
  },
  {
    src: `${studioBase}/boho-medium-midback-side.jpg`,
    alt: "Boho braids side profile.",
    position: "center 32%",
  },
  {
    src: `${studioBase}/knotless-small-waist-side.jpg`,
    alt: "Long knotless braids side profile.",
    position: "center 30%",
  },
];

export const featuredProfessional: DiscoveryProfessional = {
  slug: "amara-braids-beauty",
  name: "Amara Cole",
  businessName: "Amara Braids & Beauty",
  category: "Braids Specialist",
  title: "Protective Style Professional",
  location: "Shaw, Washington, DC",
  neighborhood: "Shaw",
  distance: "1.8 mi",
  rating: 4.9,
  reviews: 128,
  respondsIn: "1 hour",
  startingPrice: 180,
  nextAvailability: "Tomorrow at 10:00 AM",
  verified: true,
  image: {
    src: `${imageBase}/hero4.png`,
    alt: "Amara Cole smiling in a warm salon.",
    position: "50% 22%",
  },
  coverImage: {
    src: `${imageBase}/braiding-appointment-hero.png`,
    alt: "A warm Touch of Heaven salon appointment scene.",
    position: "68% center",
  },
  portfolio: [
    {
      ...amaraGallery[0]!,
      label: "Medium knotless braids",
      serviceSlug: "medium-knotless-braids",
      category: "Knotless braids",
    },
    {
      ...amaraGallery[2]!,
      label: "Boho braids",
      serviceSlug: "boho-braids",
      category: "Boho braids",
    },
    {
      src: `${studioBase}/knotless-small-waist-front.jpg`,
      alt: "Cornrow ponytail with clean parting.",
      position: "center 30%",
      label: "Cornrow ponytail",
      serviceSlug: "cornrow-ponytail",
      category: "Cornrows",
    },
    {
      ...amaraGallery[3]!,
      label: "Jumbo knotless braids",
      serviceSlug: "jumbo-knotless-braids",
      category: "Knotless braids",
    },
    {
      src: `${studioBase}/boho-wavy-waist-front.png`,
      alt: "Fulani braid inspiration style.",
      position: "center 30%",
      label: "Fulani braids",
      serviceSlug: "fulani-braids",
      category: "Cornrows",
    },
    {
      src: `${studioBase}/faux-medium-midback-front.jpg`,
      alt: "Small knotless braid inspiration style.",
      position: "center 28%",
      label: "Small knotless braids",
      serviceSlug: "small-knotless-braids",
      category: "Knotless braids",
    },
  ],
  specialties: [
    "Knotless Braids",
    "Box Braids",
    "Goddess Braids",
    "Boho Braids",
    "Feed-In Braids",
  ],
  amenities: ["Complimentary Wi-Fi", "Beverages", "Clean & private space"],
  languages: ["English"],
  hours: [
    ["Mon", "Closed"],
    ["Tue", "10:00 AM - 7:00 PM"],
    ["Wed", "10:00 AM - 7:00 PM"],
    ["Thu", "10:00 AM - 8:00 PM"],
    ["Fri", "9:00 AM - 8:00 PM"],
    ["Sat", "8:00 AM - 6:00 PM"],
    ["Sun", "10:00 AM - 4:00 PM"],
  ],
  services: [
    {
      slug: "medium-knotless-braids",
      name: "Medium Knotless Braids",
      shortName: "Knotless Braids",
      description:
        "Natural-looking, lightweight braids with a knotless technique for less tension and a more comfortable wear. Perfect for a clean, polished look that lasts.",
      price: 220,
      deposit: 55,
      duration: "4 hr 30 min",
      nextAvailability: "Tomorrow at 10:00 AM",
      image: amaraGallery[0]!,
      gallery: amaraGallery,
      included: [
        "Shampoo & condition",
        "Knotless braiding",
        "Edge styling",
        "Scalp care",
        "Lightweight finishing",
        "Take-home care tips",
      ],
      preparation: "Arrive with clean, detangled hair. No oils or heavy products.",
      aftercare: "Keep scalp clean and moisturized. Use mousse or light oil daily.",
      materials: "Yes - premium braiding hair included in the price.",
      cancellation: "Cancel or reschedule up to 24 hours before your appointment.",
      sizes: ["Small", "Medium", "Large"],
      selectedSize: "Medium",
      lengths: ["Shoulder", "Mid-back", "Waist"],
      selectedLength: "Mid-back",
    },
    {
      slug: "box-braids",
      name: "Box Braids",
      shortName: "Box Braids",
      description:
        "Classic box braids with clean parting and a polished finish for everyday styling.",
      price: 150,
      deposit: 40,
      duration: "2 - 4 hrs",
      nextAvailability: "Friday at 1:00 PM",
      image: {
        src: `${studioBase}/knotless-small-waist-back.jpg`,
        alt: "Finished box braid style.",
        position: "center 30%",
      },
      gallery: amaraGallery,
      included: ["Parting", "Braiding", "Edge styling", "Finishing mousse"],
      preparation: "Arrive with clean, detangled hair.",
      aftercare: "Wrap hair at night and moisturize scalp lightly.",
      materials: "Hair may be included depending on selected length.",
      cancellation: "Cancel or reschedule up to 24 hours before your appointment.",
      sizes: ["Small", "Medium", "Large"],
      selectedSize: "Medium",
      lengths: ["Shoulder", "Mid-back", "Waist"],
      selectedLength: "Shoulder",
    },
    {
      slug: "goddess-braids",
      name: "Goddess Braids",
      shortName: "Goddess Braids",
      description:
        "Soft curls and protective braiding combined for a romantic, long-lasting look.",
      price: 200,
      deposit: 50,
      duration: "2.5 - 5 hrs",
      nextAvailability: "Saturday at 11:30 AM",
      image: {
        src: `${studioBase}/boho-medium-waist-front.jpg`,
        alt: "Goddess braids with soft curls.",
        position: "center 30%",
      },
      gallery: amaraGallery,
      included: ["Consultation", "Braiding", "Curl finish", "Care guidance"],
      preparation: "Arrive with clean, detangled hair.",
      aftercare: "Refresh curls gently and avoid heavy oils.",
      materials: "Curl hair add-on available.",
      cancellation: "Cancel or reschedule up to 24 hours before your appointment.",
      sizes: ["Small", "Medium", "Large"],
      selectedSize: "Medium",
      lengths: ["Shoulder", "Mid-back", "Waist"],
      selectedLength: "Mid-back",
    },
  ],
  reviewsList: [
    {
      initials: "KL",
      name: "Kendra L.",
      date: "May 12, 2025",
      service: "Box Braids (Medium)",
      rating: 5,
      body:
        "Amara is amazing. My parts are so neat and the braids are lightweight. She was professional, kind, and finished right on time.",
      image: amaraGallery[0],
    },
    {
      initials: "SB",
      name: "Sharice B.",
      date: "May 8, 2025",
      service: "Knotless Braids (Large)",
      rating: 5,
      body:
        "The best braid experience I have had in DC. Clean, welcoming space and great vibes all around. Will definitely be back.",
      image: amaraGallery[2],
    },
    {
      initials: "JT",
      name: "Jasmine T.",
      date: "May 3, 2025",
      service: "Boho Knotless Braids",
      rating: 5,
      body:
        "Love the boho look. Amara paid attention to every detail and made the whole process so comfortable.",
      image: amaraGallery[3],
      response: {
        body: "Thank you so much, Jasmine. It was a pleasure having you. Cannot wait to see you again.",
        date: "May 4, 2025",
      },
    },
  ],
  credentials: [
    {
      title: "Identity verified",
      status: "Verified",
      detail: "Checked May 13, 2024",
      kind: "verified",
    },
    {
      title: "Business details verified",
      status: "Verified",
      detail: "Checked May 13, 2024",
      kind: "verified",
    },
    {
      title: "Professional license",
      status: "Not required for this service",
      detail: "License rules vary by service and location.",
      kind: "neutral",
    },
    {
      title: "8 years experience",
      status: "Verified",
      detail: "Checked May 13, 2024",
      kind: "verified",
    },
    {
      title: "Safe service practices",
      status: "Verified",
      detail: "Checked May 13, 2024",
      kind: "verified",
    },
    {
      title: "Platform history",
      status: "Verified",
      detail: "Member since 2024",
      kind: "verified",
      facts: ["184 completed bookings", "96% on-time confirmation"],
    },
  ],
};

export const discoveryProfessionals: DiscoveryProfessional[] = [
  featuredProfessional,
  {
    ...featuredProfessional,
    slug: "luxe-strands-studio",
    name: "Brielle Amari",
    businessName: "Luxe Strands Studio",
    category: "Natural Hair Specialist",
    neighborhood: "Dupont Circle",
    location: "Dupont Circle, Washington, DC",
    distance: "1.2 mi",
    rating: 5,
    reviews: 124,
    startingPrice: 220,
    nextAvailability: "Today at 1:00 PM",
    image: {
      src: `${studioBase}/boho-medium-midback-front.jpg`,
      alt: "Brielle Amari portrait in a salon.",
      position: "center 28%",
    },
    coverImage: {
      src: `${studioBase}/boho-medium-midback-front.jpg`,
      alt: "Boho braid style in a salon.",
      position: "center 32%",
    },
  },
  {
    ...featuredProfessional,
    slug: "niya-nails-studio",
    name: "Nia Brooks",
    businessName: "Niya Nails Studio",
    category: "Nail Artist",
    neighborhood: "Petworth",
    location: "Petworth, Washington, DC",
    distance: "1.1 mi",
    rating: 4.9,
    reviews: 96,
    startingPrice: 65,
    nextAvailability: "Today at 2:00 PM",
    image: {
      src: `${imageBase}/pic1.png`,
      alt: "Nia Brooks providing a manicure.",
      position: "center 36%",
    },
    coverImage: {
      src: `${imageBase}/pic1.png`,
      alt: "Close-up of a manicure in progress.",
      position: "center 38%",
    },
  },
  {
    ...featuredProfessional,
    slug: "marcus-reed-grooming",
    name: "Marcus Reed",
    businessName: "Marcus Reed Grooming",
    category: "Barber",
    neighborhood: "Capitol Hill",
    location: "Capitol Hill, Washington, DC",
    distance: "1.3 mi",
    rating: 4.8,
    reviews: 112,
    startingPrice: 45,
    nextAvailability: "Tomorrow at 11:00 AM",
    image: {
      src: `${imageBase}/pic2.png`,
      alt: "Marcus Reed grooming a client.",
      position: "center 30%",
    },
    coverImage: {
      src: `${imageBase}/pic2.png`,
      alt: "A barber appointment in a modern studio.",
      position: "center 35%",
    },
  },
  {
    ...featuredProfessional,
    slug: "solace-day-spa",
    name: "Solace Day Spa",
    businessName: "Solace Day Spa",
    category: "Day Spa",
    neighborhood: "Navy Yard",
    location: "Navy Yard, Washington, DC",
    distance: "1.6 mi",
    rating: 4.9,
    reviews: 78,
    startingPrice: 95,
    nextAvailability: "Today at 1:00 PM",
    image: {
      src: `${imageBase}/hero2.jpg`,
      alt: "A calm spa treatment room.",
      position: "center 40%",
    },
    coverImage: {
      src: `${imageBase}/hero2.jpg`,
      alt: "A relaxing spa and wellness appointment.",
      position: "center 44%",
    },
  },
  {
    ...featuredProfessional,
    slug: "crowned-by-chelsea",
    name: "Crowned by Chelsea",
    businessName: "Crowned by Chelsea",
    category: "Natural Hair Specialist",
    neighborhood: "Capitol Hill",
    location: "Capitol Hill, Washington, DC",
    distance: "2.3 mi",
    rating: 4.7,
    reviews: 86,
    startingPrice: 160,
    nextAvailability: "Today at 4:00 PM",
    image: {
      src: `${studioBase}/faux-medium-shoulder-front.jpg`,
      alt: "Chelsea natural hair portrait.",
      position: "center 32%",
    },
    coverImage: {
      src: `${studioBase}/faux-medium-shoulder-front.jpg`,
      alt: "Natural hair studio appointment.",
      position: "center 35%",
    },
  },
];

export const availabilityServices = [
  {
    name: "Knotless Braids",
    business: "Amara Cole",
    price: 180,
    time: "Fri, 10:00 AM",
    image: amaraGallery[0]!,
    href: "/businesses/amara-braids-beauty/services/medium-knotless-braids",
  },
  {
    name: "Gel Manicure",
    business: "Nia Brooks",
    price: 65,
    time: "Thu, 2:00 PM",
    image: {
      src: `${imageBase}/pic1.png`,
      alt: "Gel manicure appointment.",
      position: "center 34%",
    },
    href: "/businesses/niya-nails-studio",
  },
  {
    name: "Haircut & Beard",
    business: "Marcus Reed",
    price: 55,
    time: "Sat, 11:30 AM",
    image: {
      src: `${imageBase}/pic2.png`,
      alt: "Barber haircut and beard service.",
      position: "center 35%",
    },
    href: "/businesses/marcus-reed-grooming",
  },
  {
    name: "Signature Massage",
    business: "Solace Day Spa",
    price: 120,
    time: "Fri, 1:00 PM",
    image: {
      src: `${imageBase}/hero2.jpg`,
      alt: "Massage appointment.",
      position: "center 45%",
    },
    href: "/businesses/solace-day-spa",
  },
];

export const filterDefaults = {
  date: "Sat, May 24, 2025",
  time: "Any time",
  minPrice: "50",
  maxPrice: "200+",
  distance: "10 miles",
  rating: "4.0 & up",
  types: ["Hair professional", "Nail technician"],
  locations: ["At business", "Mobile service"],
  availability: "Any availability",
  verifiedOnly: true,
  accessibility: "None selected",
};

export function getProfessional(slug: string | undefined): DiscoveryProfessional {
  return (
    discoveryProfessionals.find((professional) => professional.slug === slug) ??
    featuredProfessional
  );
}

export function getService(
  professional: DiscoveryProfessional,
  serviceSlug: string | undefined,
): DiscoveryService {
  return (
    professional.services.find((service) => service.slug === serviceSlug) ??
    professional.services[0]!
  );
}
