import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-[#faf8f4]">
      <p className="font-[var(--font-serif)] text-[72px] text-[#e0d8cc] leading-none mb-4">404</p>
      <p className="text-[15px] text-[#8a8078] mb-8">This page doesn't exist.</p>
      <div className="flex items-center gap-4">
        <Link href="/"
          className="text-[13px] font-medium text-white bg-[#6b7c5e] px-5 py-2.5 rounded-xl hover:bg-[#5a6b4e] transition-colors">
          Home
        </Link>
        <Link href="/app"
          className="text-[13px] font-medium text-[#6b7c5e] bg-[#6b7c5e]/8 px-5 py-2.5 rounded-xl hover:bg-[#6b7c5e]/15 transition-colors">
          Open App
        </Link>
      </div>
    </main>
  );
}
