export const runtime = 'edge';

interface AdminDetailsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function AdminDetailsPage({ params }: AdminDetailsPageProps) {
	const { id } = await params;

	return (
		<div className="page stack">
			<section className="section-heading">
				<span className="section-kicker">Administration</span>
				<h1 className="section-title">Admin details</h1>
				<p className="section-copy">
					Placeholder for admin record <strong>{id}</strong>. This route is intentionally scaffolded for future PBI implementation.
				</p>
			</section>
		</div>
	);
}