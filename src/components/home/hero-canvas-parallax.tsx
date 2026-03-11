"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";

const canvases = [
  {
    src: "/header/aka.png",
    alt: "Floating paint canvas illustration",
    position: "left-[2%] top-[10%] w-[120px] sm:w-[150px] md:w-[170px] lg:w-[190px] xl:w-[220px]",
    parallax: 0.08,
    duration: "11.5s",
    rotate: "-4deg",
    drift: "14px",
    layer: "z-0 opacity-100",
  },
  {
    src: "/header/delta.png",
    alt: "Floating paint canvas illustration",
    position: "right-[6%] top-[12%] w-[110px] sm:w-[128px] md:w-[150px] lg:w-[185px] xl:w-[215px]",
    parallax: 0.12,
    duration: "9.5s",
    rotate: "3deg",
    drift: "18px",
    layer: "z-[1] opacity-100",
  },
  {
    src: "/header/image.png",
    alt: "Floating paint canvas illustration",
    position: "left-[10%] bottom-[-4%] xl:bottom-[10px] w-[130px] sm:w-[160px] md:w-[190px] lg:w-[220px] xl:w-[255px]",
    parallax: 0.16,
    duration: "10.5s",
    rotate: "5deg",
    drift: "16px",
    layer: "z-[2] opacity-100",
  },
  {
    src: "/header/tennis.png",
    alt: "Floating paint canvas illustration",
    position: "right-[12%] bottom-[8%] xl:bottom-[32px] w-[128px] sm:w-[150px] md:w-[180px] lg:w-[220px] xl:w-[255px]",
    parallax: 0.2,
    duration: "8.8s",
    rotate: "-6deg",
    drift: "22px",
    layer: "z-[3] opacity-100",
  },
  {
    src: "/header/tom.png",
    alt: "Floating paint canvas illustration",
    position: "left-[calc(50%-30px)] top-[4%] -translate-x-1/2 w-[96px] sm:w-[112px] md:w-[135px] lg:w-[165px] xl:w-[190px]",
    parallax: 0.1,
    duration: "12s",
    rotate: "-9deg",
    drift: "12px",
    layer: "z-[1] opacity-100",
  },
];

const topCanvasSources = new Set(["/header/aka.png", "/header/delta.png", "/header/tom.png"]);
const bottomCanvasSources = new Set(["/header/image.png", "/header/tennis.png"]);

export function HeroCanvasParallax() {
  const [scrollY, setScrollY] = useState(0);

  const topCanvases = canvases.filter((canvas) => topCanvasSources.has(canvas.src));
  const bottomCanvases = canvases.filter((canvas) => bottomCanvasSources.has(canvas.src));
  const middleCanvases = canvases.filter(
    (canvas) => !topCanvasSources.has(canvas.src) && !bottomCanvasSources.has(canvas.src),
  );

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible [perspective:1400px]">
      <div className="absolute inset-0 overflow-hidden">
        {middleCanvases.map((canvas, index) => (
          <div
            key={canvas.src}
            className={["absolute", canvas.position, canvas.layer].join(" ")}
            style={{
              transform: `translate3d(0, ${scrollY * canvas.parallax}px, 0)`,
            }}
          >
            <div
              className="hero-canvas-float"
              style={
                {
                  "--float-duration": canvas.duration,
                  "--float-rotate": canvas.rotate,
                  "--float-drift": canvas.drift,
                  animationDelay: `${index * 0.6}s`,
                } as CSSProperties
              }
            >
              <div className="relative aspect-square overflow-hidden rounded-[22px] bg-transparent">
                <Image
                  src={canvas.src}
                  alt={canvas.alt}
                  fill
                  sizes="(max-width: 640px) 28vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 16vw"
                  className="object-cover"
                  priority={index < 2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {topCanvases.map((canvas, index) => (
        <div
          key={canvas.src}
          className={["absolute", canvas.position, canvas.layer].join(" ")}
          style={{
            transform: `translate3d(0, ${scrollY * canvas.parallax}px, 0)`,
          }}
        >
          <div
            className="hero-canvas-float"
            style={
              {
                "--float-duration": canvas.duration,
                "--float-rotate": canvas.rotate,
                "--float-drift": canvas.drift,
                animationDelay: `${index * 0.6}s`,
              } as CSSProperties
            }
          >
            <div className="relative aspect-square overflow-hidden rounded-[22px] bg-transparent">
              <Image
                src={canvas.src}
                alt={canvas.alt}
                fill
                sizes="(max-width: 640px) 28vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 16vw"
                className="object-cover"
                priority={index < 2}
              />
            </div>
          </div>
        </div>
      ))}

      {bottomCanvases.map((canvas, index) => (
        <div
          key={canvas.src}
          className={["absolute", canvas.position, canvas.layer].join(" ")}
          style={{
            transform: `translate3d(0, ${scrollY * canvas.parallax}px, 0)`,
          }}
        >
          <div
            className="hero-canvas-float"
            style={
              {
                "--float-duration": canvas.duration,
                "--float-rotate": canvas.rotate,
                "--float-drift": canvas.drift,
                animationDelay: `${(topCanvases.length + middleCanvases.length + index) * 0.6}s`,
              } as CSSProperties
            }
          >
            <div className="relative aspect-square overflow-hidden rounded-[22px] bg-transparent">
              <Image
                src={canvas.src}
                alt={canvas.alt}
                fill
                sizes="(max-width: 640px) 28vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 16vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .hero-canvas-float {
          animation: heroCanvasFloat var(--float-duration) ease-in-out infinite;
          transform: rotate(var(--float-rotate)) translateZ(0);
          transform-origin: center;
          will-change: transform;
        }

        @keyframes heroCanvasFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--float-rotate));
          }
          50% {
            transform: translate3d(0, calc(var(--float-drift) * -1), 0)
              rotate(calc(var(--float-rotate) * 0.55));
          }
        }
      `}</style>
    </div>
  );
}
