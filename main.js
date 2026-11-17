const commodities = [
  { name: "豆粕", code: "m2601", price: 2924, change: 1.16, volume: 1684320, openInterest: 2411880, links: ["国际", "期权", "夜盘"], seed: "soymeal" },
  { name: "豆油", code: "y2601", price: 7896, change: 0.47, volume: 612440, openInterest: 498220, links: ["国际", "期权", "夜盘"], seed: "soyoil" },
  { name: "玉米", code: "c2601", price: 2238, change: -0.35, volume: 904110, openInterest: 1312040, links: ["期权", "夜盘"], seed: "maize" },
  { name: "生猪", code: "lh2601", price: 14285, change: 0.88, volume: 73440, openInterest: 98620, links: ["期权"], seed: "hogfarm" },
  { name: "豆一", code: "a2601", price: 4186, change: 0.62, volume: 86420, openInterest: 142330, links: ["国际", "期权", "夜盘"], seed: "soybean" },
];

const news = {
  notice: [
    { hour_minute: "09:41", title: "美湾大豆升贴水持稳，近月船期询盘增加", meta: "10月30日 09:41" },
    { hour_minute: "09:16", title: "南美降水带南压，阿根廷北部墒情改善", meta: "10月30日 09:16" },
    { hour_minute: "08:52", title: "豆粕基差华东持平，华南小幅走弱", meta: "10月30日 08:52" },
    { hour_minute: "08:20", title: "青岛到港预报下周集中，油厂开机维持高位", meta: "10月30日 08:20" },
  ],
  daily: [
    { title: "采购中心简报：压榨利润与到港节奏", meta: "2026年10月30日" },
    { title: "采购中心简报：美豆出口检验偏强", meta: "2026年10月29日" },
    { title: "图标简报：豆油跟涨，现货成交一般", meta: "2026年10月28日" },
  ],
  brief: [
    { title: "美国中西部预报转干，播种窗口重新打开", meta: "路透财经早报 · 10月30日" },
    { title: "国内油厂豆粕库存连续第二周下降", meta: "格隆汇快讯 · 10月30日" },
    { title: "爱荷华本周降水偏多，出苗进度需要再看", meta: "mysteel · 10月30日" },
  ],
};

const photoSets = {
  notice: ["harborcrane", "soyfield", "grainship"],
  daily: ["briefingdesk", "soyoil", "qingdaoport"],
  brief: ["weatherplain", "mealplant", "iowafield"],
};

const bento = document.getElementById("bento");
const quoteList = document.getElementById("quoteList");
const quotePhotos = document.getElementById("quotePhotos");
let sortKey = null;
let sortDir = null;
let newsTab = "notice";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatVolume(n) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

function renderCommodities() {
  const rows = [...commodities];
  if (sortKey && sortDir) {
    rows.sort((a, b) => (sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
  }
  bento.innerHTML = rows.map((item, index) => {
    const span = index < 3 ? "span-4" : "span-6";
    const dir = item.change > 0 ? "up" : item.change < 0 ? "down" : "";
    const sign = item.change > 0 ? "+" : "";
    const links = item.links.map((label) => `<span>${label}</span>`).join("");
    return `<article class="card ${span}">
      <div class="card-top"><h3>${item.name}</h3><span class="code">${item.code}</span></div>
      <div class="price">${item.price.toLocaleString("zh-CN")}</div>
      <div class="change ${dir}">${sign}${item.change.toFixed(2)}%</div>
      <div class="card-visual"><img src="https://picsum.photos/seed/${item.seed}/960/320" alt="" /></div>
      <div class="meta">
        <div>成交<b>${formatVolume(item.volume)}</b></div>
        <div>持仓<b>${formatVolume(item.openInterest)}</b></div>
      </div>
      <div class="card-links">${links}</div>
    </article>`;
  }).join("");
}

function renderQuote() {
  quoteList.innerHTML = news[newsTab].map((item) => (
    `<article><time>${item.meta}</time><p>${item.title}</p></article>`
  )).join("");
  quotePhotos.innerHTML = photoSets[newsTab].map((seed) => (
    `<img src="https://picsum.photos/seed/${seed}/900/640" alt="" />`
  )).join("");
}

function bindLayerDock() {
  const dock = document.querySelector(".layer-dock");
  const orb = document.getElementById("layerOrb");
  if (!dock || !orb) return;
  orb.addEventListener("click", () => {
    const open = dock.classList.toggle("is-open");
    orb.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function bindAccordion() {
  const panels = [...document.querySelectorAll("[data-panel]")];
  const open = (target) => {
    panels.forEach((panel) => panel.classList.toggle("is-open", panel === target));
  };
  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => open(panel));
    panel.addEventListener("focus", () => open(panel));
    panel.addEventListener("click", () => open(panel));
  });
}

document.querySelectorAll("[data-sort]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.sort;
    if (sortKey === key) {
      if (sortDir === "desc") sortDir = "asc";
      else { sortKey = null; sortDir = null; }
    } else {
      sortKey = key;
      sortDir = "desc";
    }
    document.querySelectorAll("[data-sort]").forEach((el) => {
      const on = el.dataset.sort === sortKey;
      el.classList.toggle("is-active", on);
      el.querySelector(".arrows").textContent = !on ? "▲▼" : sortDir === "desc" ? "▲" : "▼";
    });
    renderCommodities();
  });
});

function setNewsTab(tab) {
  if (tab === newsTab) return false;
  newsTab = tab;
  document.querySelectorAll(".news-tabs [data-tab]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.tab === tab);
  });
  renderQuote();
  return true;
}

document.querySelectorAll(".news-tabs [data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.tab;
    if (next === newsTab) return;
    const swap = () => {
      setNewsTab(next);
    };
    const gsap = window.gsap;
    const panels = [quoteList, quotePhotos];
    if (!gsap || reduceMotion) {
      swap();
      return;
    }
    gsap.to(panels, {
      autoAlpha: 0,
      y: 10,
      duration: 0.2,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        swap();
        quoteList.classList.add("is-revealed");
        quotePhotos.classList.add("is-revealed");
        gsap.set(panels, { autoAlpha: 1, y: 0 });
        const rotations = [-6, 3, 7];
        gsap.fromTo("#quoteList article",
          { autoAlpha: 0, y: 18, clipPath: "inset(0 0 100% 0)" },
          { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.out", stagger: 0.06, overwrite: true },
        );
        [...quotePhotos.children].forEach((img, i) => {
          const rot = rotations[i] ?? 0;
          gsap.fromTo(img,
            { autoAlpha: 0, y: 18, rotation: rot, scale: 0.92 },
            { autoAlpha: 1, y: 0, rotation: rot, scale: 1, duration: 0.7, ease: "expo.out", delay: i * 0.06, overwrite: true },
          );
        });
      },
    });
  });
});

document.querySelectorAll(".mega [data-tab], .drop [data-tab]").forEach((link) => {
  link.addEventListener("click", () => setNewsTab(link.dataset.tab));
});

bindAccordion();
bindLayerDock();
renderQuote();
renderCommodities();
import("./globe.js?v=fix5").then(({ initGlobe }) => {
  const stage = document.getElementById("stage");
  if (stage) initGlobe(stage, { labels: false });
}).catch((err) => console.warn(err));

function mountMotion() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove("js-motion");
    window.__motionReady = true;
    return;
  }

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  const ease = "expo.out";
  const rotations = [-6, 3, 7];

  function wrapMask(targets) {
    return gsap.utils.toArray(targets).map((el) => {
      let inner = el.querySelector(":scope > .mask-inner");
      if (!inner) {
        const only = el.childElementCount === 1 ? el.firstElementChild : null;
        if (only && only.tagName === "SPAN" && el.childNodes.length === 1) {
          inner = only;
          inner.classList.add("mask-inner");
        } else {
          inner = document.createElement("span");
          inner.className = "mask-inner";
          while (el.firstChild) inner.appendChild(el.firstChild);
          el.appendChild(inner);
        }
      }
      el.classList.add("mask-line");
      return inner;
    });
  }

  function riseLines(tl, targets, at = 0) {
    const inners = wrapMask(targets);
    if (!inners.length) return;
    const parents = [...new Set(inners.map((inner) => (
      inner.parentElement.closest("h1, h2, .display") || inner.parentElement
    )))];
    gsap.set(inners, { yPercent: 120 });
    tl.set(parents, { autoAlpha: 1 }, at);
    tl.to(inners, { yPercent: 0, duration: 1.05, stagger: 0.1, ease }, at);
  }

  function chapter(trigger, start, build) {
    const tl = gsap.timeline({ paused: true, defaults: { ease, overwrite: "auto" } });
    build(tl);
    const st = ScrollTrigger.create({
      trigger,
      start,
      once: true,
      onEnter: () => tl.play(0),
    });
    if (st.isActive) tl.play(0);
    return tl;
  }

  const hero = gsap.timeline({ defaults: { ease, overwrite: "auto" } });
  riseLines(hero, ".display .line", 0.08);
  hero.fromTo(".nav-bar", { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0)
    .fromTo(".hero-lead", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.34)
    .fromTo(".hero-actions .btn", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08 }, 0.44)
    .fromTo(".globe-stage", { autoAlpha: 0, scale: 0.88 }, { autoAlpha: 1, scale: 1, duration: 1.25 }, 0.12);

  chapter("#news", "top 78%", (tl) => {
    gsap.set("#quoteList article", { autoAlpha: 0, y: 28, clipPath: "inset(0 0 100% 0)" });
    riseLines(tl, "#news .inline-heading .line", 0);
    tl.add(() => {
      quoteList.classList.add("is-revealed");
      quotePhotos.classList.add("is-revealed");
    }, 0);
    tl.fromTo(".desire-lead", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65 }, 0.18)
      .fromTo(".news-tabs", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55 }, 0.26)
      .to("#quoteList article",
        { y: 0, autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 0.75, stagger: 0.08 },
        0.16,
      );
    [...document.querySelectorAll(".quote-photos img")].forEach((img, i) => {
      const rot = rotations[i] ?? 0;
      gsap.set(img, { autoAlpha: 0, y: 32, scale: 0.86, rotation: rot });
      tl.to(img,
        { autoAlpha: 1, y: 0, scale: 1, rotation: rot, duration: 0.95 },
        0.28 + i * 0.1,
      );
    });
  });

  chapter("#markets", "top 80%", (tl) => {
    gsap.set(".sorts button", { autoAlpha: 0, y: 12 });
    gsap.set("#bento .card", { autoAlpha: 0, y: 42, clipPath: "inset(16% 0 0 0)" });
    tl.set(".market-head", { autoAlpha: 1 }, 0);
    tl.add(() => bento.classList.add("is-revealed"), 0);
    riseLines(tl, ".market-head h2", 0);
    tl.to(".sorts button", { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 }, 0.12)
      .to("#bento .card",
        { y: 0, autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.95, stagger: 0.09 },
        0.14,
      );
  });

  chapter("#corridors", "top 82%", (tl) => {
    riseLines(tl, "#corridors .inline-heading", 0);
    tl.fromTo("#accordion .acc-panel",
      { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
      { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, stagger: 0.12 },
      0.1,
    );
  });

  chapter(".action", "top 88%", (tl) => {
    riseLines(tl, ".action h2", 0);
    tl.fromTo(".action .btn", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.18);
  });

  window.__motionReady = true;
  const hashEl = location.hash ? document.querySelector(location.hash) : null;
  if (hashEl) hashEl.scrollIntoView({ behavior: "auto", block: "start" });
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountMotion);
else mountMotion();
