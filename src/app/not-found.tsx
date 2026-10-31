import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <p>Task or page not found.</p>
      <Link href="/" className="btn">
        Back to the list
      </Link>
    </div>
  );
}
