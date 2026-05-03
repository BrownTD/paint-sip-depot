import { HeroCanvasParallax } from "@/components/home/hero-canvas-parallax";

export function FloatingCanvasSection() {
  return (
    <section className="relative h-screen overflow-visible bg-white">
      <div className="absolute inset-0 z-[2] overflow-hidden">
        <HeroCanvasParallax />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
        <div className="translate-y-[130px] md:translate-y-[182px]">
          <div className="h-px w-40 bg-black/70 md:w-56" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="translate-y-[30px] text-center">
          <h2 className="font-display text-[3.85rem] font-bold leading-none text-black md:text-[8.75rem]">
            How It Works
          </h2>
          <p className="mt-6 text-[1.5rem] leading-tight text-black md:text-[3rem]">
            Launch your paint &amp; sip event in 3 simple steps
          </p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[-1px] z-[1] overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="block h-24 w-full md:h-32 lg:h-40"
          aria-hidden="true"
        >
          <path
            fill="#efe7ff"
            d="M0,118C72,92,144,67,237,71C330,75,443,109,560,131C677,153,798,162,907,145C1015,128,1110,84,1207,77C1304,70,1404,100,1440,115L1440,220L0,220Z"
          />
        </svg>
      </div>
    </section>
  );
}
