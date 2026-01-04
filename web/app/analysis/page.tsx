import Link from "next/link";

export default function AnalysisPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Analysis</h1>
      <p>Этот этап запускается только после ADMITTED.</p>
      <p>Процесс строго последовательный. Анализ невозможен без допуска</p>

      <p><Link href="/">← На главную</Link></p>
    </main>
  );
}