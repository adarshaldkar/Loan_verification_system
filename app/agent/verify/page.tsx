import { redirect } from "next/navigation";

// /agent/verify redirects to cases — verification always requires a case ID
export default function VerifyIndexPage() {
  redirect("/agent/cases");
}
