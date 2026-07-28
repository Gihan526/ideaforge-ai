import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8e8e6] bg-white px-3 py-1 text-xs font-medium text-[#6b6b6b] shadow-sm">
          <Sparkles className="size-3.5 text-[#37352f]" />
          Try 5 ideas free, no account needed
        </div>
        <h1 className="max-w-2xl text-center text-4xl font-semibold tracking-tight text-[#1f1f1d] sm:text-5xl">
          Welcome to IdeaHub
        </h1>
        <p className="mt-4 max-w-xl text-center text-base text-[#6b6b6b]">
          Capture ideas, generate system designs, and break them into tasks —
          all in one place. Sign in to keep them forever, or jump in as a guest
          to test the waters.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button
            asChild
            className="h-10 gap-2 bg-[#37352f] px-5 text-sm text-white hover:bg-[#1f1f1d]"
          >
            <Link href="/dashboard">
              Try as a guest
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
