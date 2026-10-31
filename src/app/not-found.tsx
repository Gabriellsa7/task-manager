import Link from "next/link";
import { button, card } from "@/components/styles";

export default function NotFound() {
  return (
    <div className={`${card} space-y-3`}>
      <p>Task or page not found.</p>
      <Link href="/" className={button.default}>
        Back to the list
      </Link>
    </div>
  );
}
