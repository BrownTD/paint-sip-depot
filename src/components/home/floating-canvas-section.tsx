import { HeroCanvasParallax } from "@/components/home/hero-canvas-parallax";

export function FloatingCanvasSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      <div className="absolute inset-0">
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
    </section>
  );
}
