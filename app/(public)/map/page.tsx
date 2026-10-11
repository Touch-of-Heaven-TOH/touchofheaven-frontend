import { redirect } from "next/navigation";

// The map now lives beside the results on Businesses.
export default function MapRedirect() {
  redirect("/businesses");
}
