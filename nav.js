(function bindNav() {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const items = [...document.querySelectorAll(".nav-item")];
  if (!nav || !toggle) return;

  const desktop = () => window.matchMedia("(min-width: 981px)").matches;
  const closeMenus = () => {
    items.forEach((item) => {
      item.classList.remove("is-open");
      const trigger = item.querySelector("[data-menu]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  };
  const closeDrawer = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开菜单");
    document.body.classList.remove("nav-locked");
    closeMenus();
  };

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-hidden");
      lastY = y;
      return;
    }
    const goingDown = y > lastY + 8;
    const goingUp = y < lastY - 8;
    if (y < 48) {
      nav.classList.remove("is-hidden");
    } else if (goingDown) {
      nav.classList.add("is-hidden");
      closeMenus();
    } else if (goingUp) {
      nav.classList.remove("is-hidden");
    }
    lastY = y;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    document.body.classList.toggle("nav-locked", open);
    if (!open) closeMenus();
  });

  items.forEach((item) => {
    const trigger = item.querySelector("[data-menu]");
    if (!trigger) return;
    trigger.addEventListener("click", (event) => {
      if (desktop()) return;
      event.preventDefault();
      const open = !item.classList.contains("is-open");
      items.forEach((other) => {
        if (other !== item) {
          other.classList.remove("is-open");
          const otherTrigger = other.querySelector("[data-menu]");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.querySelectorAll(".nav-links a, .nav-enter, .nav-login, .brand").forEach((link) => {
    link.addEventListener("click", () => {
      if (link.matches("[data-menu]")) return;
      document.querySelectorAll(".nav-link").forEach((el) => {
        el.classList.toggle("is-current", el === link);
      });
      if (!desktop()) closeDrawer();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
  window.addEventListener("resize", () => {
    if (desktop()) closeDrawer();
  });
})();
