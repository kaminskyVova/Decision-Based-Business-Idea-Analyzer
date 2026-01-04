import Link from "next/link";

export default function PlanPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Plan</h1>
      <p>План формируется только при положительном вердикте (или при условиях).</p>

      <p><Link href="/">← На главную</Link></p>
    </main>
  );
}