import Header from "@/components/header";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <Header />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Welcome to IdeaHub
      </h1>
    </main>
  );
}
