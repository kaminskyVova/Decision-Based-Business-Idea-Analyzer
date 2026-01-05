import Link from 'next/link';

export default function HomePage() {
	return (
		<main style={{ padding: 24, fontFamily: 'system-ui' }}>
			<h1>Decision-Based Business Idea Analyzer</h1>
			<p>Выбери модуль/Choose a module:</p>

			<ul style={{ lineHeight: 2 }}>
				<li>
					<Link href="/gatekeeper">Gatekeeper</Link>
				</li>
				<li>
					<Link href="/analysis">Analysis</Link>
				</li>
				<li>
					<Link href="/plan">Plan</Link>
				</li>
			</ul>
		</main>
	);
}
