"use client";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "captain", label: "主将挨拶" },
  { id: "venues",  label: "活動場所" },
  { id: "appeal",  label: "ラクロスの魅力" },
  { id: "faq",     label: "よくある質問" },
];

function getHeaderHeight(): number {
  return (document.querySelector(".header") as HTMLElement | null)?.offsetHeight ?? 88;
}

export default function AboutSideNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const onScroll = () => {
      const offset = getHeaderHeight() + 32; // 32px buffer below header
      const scrollY = window.scrollY + offset;

      // Walk sections bottom-to-top, first one whose top <= scrollY wins
      let found = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) found = id;
      }
      setActive(found);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialise on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getHeaderHeight() - 16;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <aside
      className="sideNav hidden lg:block lg:fixed lg:top-24 lg:left-8 lg:w-64"
      aria-label="このページの目次"
    >
      <nav className="sideNav__card">
        <ul className="sideNav__list" role="tablist">
          {SECTIONS.map(({ id, label }) => (
            <li key={id} className="sideNav__item">
              <a
                href={`#${id}`}
                className={`sideNav__link${active === id ? " is-active" : ""}`}
                onClick={(e) => handleClick(e, id)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
