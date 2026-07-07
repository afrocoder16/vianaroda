type Props = {
  title?: string;
  description?: string;
};

const setupSteps = [
  "Start PostgreSQL with `docker compose up -d` or your local Postgres service.",
  "Apply the schema with `npm run prisma:migrate`.",
  "Load the sample catalog with `npm run prisma:seed`.",
];

export function DatabaseUnavailablePanel({
  title = "Storefront preview needs PostgreSQL",
  description = "The app could not reach the database at localhost:5432, so catalog data is not available yet.",
}: Props) {
  return (
    <section className="section-shell space-y-6 p-8 md:p-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
          Database required
        </p>
        <h1 className="text-3xl font-black tracking-[-0.04em] md:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-[#5f5b74] md:text-base">
          {description}
        </p>
      </div>

      <ol className="grid gap-3 text-sm text-[#3d3958]">
        {setupSteps.map((step, index) => (
          <li
            key={step}
            className="rounded-[1.5rem] border border-[#e4dfff] bg-[#fbfaff] px-4 py-4"
          >
            <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="rounded-[1.5rem] bg-[#231f4f] px-4 py-4 text-sm text-[#ece9ff]">
        Once Postgres is running, refresh this page and the storefront will load
        normally.
      </p>
    </section>
  );
}
