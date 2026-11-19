import Wall from "@/components/Wall";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <header className="bg-[#3b5998] text-white">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-4 py-2">
          <span className="text-[22px] font-bold tracking-tight">wall</span>
          <span className="text-[12px] text-[#d8dfea]">A 2008-style wall · Next.js + Supabase</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-[980px] flex-col gap-4 px-4 py-4 md:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-3 md:w-[200px]">
          {/* Profile photo placeholder: replace /profile.svg with a real photo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profile.svg"
            alt="Profile photo of Rene Vincent Cosme"
            width={200}
            height={200}
            className="mx-auto h-[200px] w-[200px] border border-[#ccc] bg-white md:mx-0"
          />
          <section className="border border-[#d8dfea] bg-white text-[12px]">
            <h2 className="bg-[#eceff5] px-2 py-1 font-bold text-[#333]">Information</h2>
            <dl className="space-y-2 p-2 text-[#333]">
              <div>
                <dt className="text-[#999]">Networks</dt>
                <dd>FEU Institute of Technology</dd>
              </div>
              <div>
                <dt className="text-[#999]">Current city</dt>
                <dd>Manila, Philippines</dd>
              </div>
              <div>
                <dt className="text-[#999]">Studying</dt>
                <dd>BS Computer Science (Software Engineering)</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="min-w-0 flex-1 border border-[#d8dfea] bg-white p-4">
          <h1 className="text-[20px] font-bold text-[#333]">Rene Vincent Cosme</h1>
          <p className="mb-3 text-[13px] text-[#666]">Leave a message on my wall. No sign-in needed.</p>
          <Wall />
        </section>
      </main>

      <footer className="mx-auto max-w-[980px] px-4 pb-6 text-[11px] text-[#999]">
        Built by Rene Vincent Cosme with Next.js, React, Tailwind CSS, shadcn/ui and Supabase ·{" "}
        <a className="text-[#3b5998] hover:underline" href="https://github.com/RVBCosme/wall">
          Source
        </a>
      </footer>
    </div>
  );
}
