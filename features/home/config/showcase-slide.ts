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