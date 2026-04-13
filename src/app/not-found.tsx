import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-background">
      <p className="font-[var(--font-serif)] text-[72px] text-input leading-none mb-4">404</p>
      <p className="text-[15px] text-muted-foreground mb-8">This page doesn&apos;t exist.</p>
      <div className="flex items-center gap-4">
        <Link href="/"
          className="text-[13px] font-medium text-primary-foreground bg-olive px-5 py-2.5 rounded-xl hover:bg-olive/90 transition-colors">
          Home
        </Link>
        <Link href="/app"
          className="text-[13px] font-medium text-olive bg-olive/10 px-5 py-2.5 rounded-xl hover:bg-olive/20 transition-colors">
          Open App
        </Link>
      </div>
    </main>
  );
}
