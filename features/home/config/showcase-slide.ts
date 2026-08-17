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