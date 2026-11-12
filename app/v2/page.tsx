import { redirect } from "next/navigation";

// Холст переехал на главную — старые ссылки на /v2 ведут туда же.
export default function V2Page() {
  redirect("/");
}
