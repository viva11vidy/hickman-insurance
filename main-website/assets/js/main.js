/* =========================================================
   Jennifer Hickman Insurance Agency — Home interactions
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  const navToggle = $("#navToggle");
  const nav = $("#mainNav");
  if (navToggle && nav) {
    const setNav = (open) => {
      nav.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    navToggle.addEventListener("click", () => setNav(!nav.classList.contains("open")));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setNav(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 991) setNav(false); });
  }

  /* ---------- Simple "single active item" helper ---------- */
  function activateOne(items, active, cls = "active") {
    items.forEach((el) => el.classList.toggle(cls, el === active));
  }

  /* ---------- Priorities tabs ---------- */
  const prioTabs = $$(".priorities-tabs a");
  prioTabs.forEach((tab) =>
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      activateOne(prioTabs, tab);
    })
  );

  /* ---------- Commercial coverage cards (hover/focus highlights one card) ---------- */
  const bizCards = $$("#bizGrid .biz-card");
  bizCards.forEach((card) => {
    card.addEventListener("mouseenter", () => activateOne(bizCards, card));
  });

  /* ---------- Quote form ---------- */
  const form = $("#quoteForm");
  if (form) {
    const typeBtns = $$(".type-btn", form);
    const typeInput = $("#quoteType");
    const msg = $("#formMsg");
    const select = $("select", form);

    typeBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        activateOne(typeBtns, btn);
        typeBtns.forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
        typeInput.value = btn.dataset.type;
      })
    );

    if (select) {
      select.addEventListener("change", () => select.classList.toggle("has-value", !!select.value));
    }

    const zip = form.elements.zip;
    zip.addEventListener("input", () => { zip.value = zip.value.replace(/\D/g, "").slice(0, 5); });

    const validators = {
      name: (v) => v.trim().length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      phone: (v) => v.replace(/\D/g, "").length >= 10,
      zip: (v) => /^\d{5}$/.test(v),
      contact: (v) => v !== "",
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      Object.keys(validators).forEach((name) => {
        const field = form.elements[name];
        const ok = validators[name](field.value);
        field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });

      const agree = form.elements.agree;
      agree.closest(".check").classList.toggle("invalid", !agree.checked);
      if (!agree.checked) valid = false;

      msg.className = "form-msg " + (valid ? "success" : "error");
      if (!valid) {
        msg.textContent = "Please fill in the required fields highlighted above.";
        const firstInvalid = $(".invalid", form);
        if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
        return;
      }

      // TODO: connect to backend / form service
      msg.textContent = "Thank you! We'll be in touch shortly about your " + typeInput.value.toLowerCase() + " quote.";
      form.reset();
      select.classList.remove("has-value");
      activateOne(typeBtns, typeBtns[0]);
      typeInput.value = "Auto";
    });

    $$(".field", form).forEach((f) =>
      f.addEventListener("input", () => f.classList.remove("invalid"))
    );
    form.elements.agree.addEventListener("change", (e) =>
      e.target.closest(".check").classList.remove("invalid")
    );
  }

  /* ---------- Services slider ----------
     Desktop: hovering / focusing a card expands it; the arrows slide the
     track one card at a time (the first visible card is expanded at rest).
     Phones (stacked layout, no hover): arrows and taps pick the open card. */
  const sTrack = $("#servicesTrack");
  if (sTrack) {
    const cards = $$(".service-card", sTrack);
    const viewport = sTrack.parentElement;
    const prev = $("#servicesPrev");
    const next = $("#servicesNext");
    const stacked = window.matchMedia("(max-width: 767px)");
    let index = 0;

    const cssPx = (name) => parseFloat(getComputedStyle(sTrack).getPropertyValue(name)) || 0;

    // last index at which the remaining cards still fill the viewport
    const maxIndex = () => {
      if (stacked.matches) return cards.length - 1;
      const room = viewport.clientWidth - cssPx("--card-open");
      const fit = Math.max(0, Math.floor((room + 1) / (cssPx("--card-w") + cssPx("--gap"))));
      return Math.max(0, cards.length - 1 - fit);
    };

    const open = (card) => activateOne(cards, card);

    // slide so card `i` is first; `reopen` also expands it (false on resize,
    // so a hovered card stays open)
    const go = (i, reopen = true) => {
      const max = maxIndex();
      const prevIndex = index;
      index = Math.min(Math.max(i, 0), max);
      sTrack.style.setProperty("--index", stacked.matches ? 0 : index);
      if (reopen || index !== prevIndex) open(cards[index]);
      prev.disabled = index === 0;
      next.disabled = index === max;
    };

    cards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => { if (!stacked.matches) open(card); });
      card.addEventListener("focus", () => (stacked.matches ? go(i) : open(card)));
      card.addEventListener("click", () => { if (stacked.matches) go(i); });
    });
    // back to the first visible card when the pointer / focus leaves the row
    sTrack.addEventListener("mouseleave", () => { if (!stacked.matches) open(cards[index]); });
    sTrack.addEventListener("focusout", (e) => {
      if (!sTrack.contains(e.relatedTarget)) open(cards[index]);
    });

    prev.addEventListener("click", () => go(index - 1));
    next.addEventListener("click", () => go(index + 1));
    window.addEventListener("resize", () => go(index, false));
    go(0);
  }

  /* ---------- Reusable infinite-loop carousel with autoplay ----------
     options:
       track     – element whose children are the slides (needs a CSS transform transition)
       prev/next – optional arrow buttons
       interval  – autoplay delay in ms
       slideMs   – CSS transition duration of the track (keep in sync with style.css)
       highlight – add .active to the first visible slide
  */
  function initLoopCarousel({ track, prev, next, dots, interval = 4000, slideMs = 500, highlight = false }) {
    if (!track) return;
    const originals = Array.from(track.children);
    const total = originals.length;
    const viewport = track.parentElement;

    // Append clones so the visible area is always filled and the loop is seamless
    originals.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
    const slides = Array.from(track.children);

    let index = 0;
    let busy = false;
    let timer = null;

    // Optional dot navigation (one dot per original slide)
    const dotEls = [];
    if (dots) {
      originals.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => { goTo(i); start(); });
        dots.appendChild(dot);
        dotEls.push(dot);
      });
    }

    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    };

    const render = (animate = true) => {
      track.classList.toggle("no-anim", !animate);
      track.style.transform = `translateX(${-index * step()}px)`;
      if (highlight) activateOne(slides, slides[index]);
      dotEls.forEach((d, i) => {
        const on = i === index % total;
        d.classList.toggle("active", on);
        d.setAttribute("aria-selected", String(on));
      });
      if (!animate) {
        void track.offsetWidth; // flush styles before re-enabling transitions
        track.classList.remove("no-anim");
      }
    };

    const settle = () => {
      busy = false;
      if (index >= total) {
        // reached the clones — snap back to the real slide silently
        index -= total;
        render(false);
      }
    };

    const go = (dir) => {
      if (busy) return;
      if (dir < 0 && index === 0) {
        // jump to the matching clone, then slide back one
        index = total;
        render(false);
      }
      busy = true;
      index += dir;
      render(true);
      // a timer instead of `transitionend` so it also works when transitions are disabled
      setTimeout(settle, slideMs + 30);
    };

    const goTo = (i) => {
      if (busy || i === index) return;
      busy = true;
      index = i;
      render(true);
      setTimeout(settle, slideMs + 30);
    };

    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(() => go(1), interval);
    };

    if (prev) prev.addEventListener("click", () => { go(-1); start(); });
    if (next) next.addEventListener("click", () => { go(1); start(); });

    viewport.addEventListener("mouseenter", stop);
    viewport.addEventListener("mouseleave", start);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    window.addEventListener("resize", () => render(false));

    render(false);
    start();
  }

  /* ---------- Core coverage carousel ---------- */
  initLoopCarousel({
    track: $("#coverageTrack"),
    prev: $("#coveragePrev"),
    next: $("#coverageNext"),
    interval: 4500,
    highlight: true,
  });

  const covTrack = $("#coverageTrack");
  if (covTrack) {
    covTrack.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".coverage-card");
      if (card) {
        const allCards = $$(".coverage-card", covTrack);
        activateOne(allCards, card);
      }
    });

    covTrack.addEventListener("click", (e) => {
      const card = e.target.closest(".coverage-card");
      if (card) {
        const targetLink = e.target.closest("a");
        if (targetLink && targetLink.getAttribute("href") && targetLink.getAttribute("href") !== "#") {
          return; // Allow standard anchor navigation if specific link has an ID
        }
        e.preventDefault();
        const quoteEl = $("#quote");
        if (quoteEl) {
          quoteEl.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }

  /* ---------- Awards carousel (Why Choose Us) ---------- */
  initLoopCarousel({
    track: $("#awardsTrack"),
    prev: $("#awardsPrev"),
    next: $("#awardsNext"),
    dots: $("#awardsDots"),
    interval: 3500,
  });

  /* ---------- Testimonials carousel ---------- */
  initLoopCarousel({
    track: $("#testiTrack"),
    prev: $("#testiPrev"),
    next: $("#testiNext"),
    interval: 4000,
    highlight: true,
  });

  /* ---------- Savings accordion ---------- */
  const savings = $$("#savingsList .saving");
  savings.forEach((item) => {
    const open = () => {
      activateOne(savings, item);
      savings.forEach((s) => $(".saving-num", s).setAttribute("aria-expanded", String(s === item)));
    };
    $(".saving-num", item).addEventListener("click", open);
    $(".saving-toggle", item).addEventListener("click", open);
  });

  /* ---------- FAQ accordion ---------- */
  const faqItems = $$("#faqList .faq-item");
  faqItems.forEach((item) => {
    const btn = $(".faq-q", item);
    btn.addEventListener("click", () => {
      const willOpen = !item.classList.contains("open");
      faqItems.forEach((other) => {
        other.classList.remove("open");
        $(".faq-q", other).setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- WOW.js Animations ---------- */
  if (typeof WOW === "function") {
    new WOW({
      boxClass: "wow",
      animateClass: "animate__animated",
      offset: 0,
      mobile: true,
      live: true,
    }).init();
  }

  /* =========================================================
     GSAP & SCROLLTRIGGER PROFESSIONAL ANIMATIONS
     ========================================================= */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      // 1. HERO ENTRANCE (Runs smoothly on page load)
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if ($(".hero-title")) {
        heroTl.from(".hero-title", { opacity: 0, y: 35, duration: 0.9 })
              .from(".hero-text", { opacity: 0, y: 25, duration: 0.8 }, "-=0.6")
              .from(".hero .btn-group", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
              .from(".hero-awards", { opacity: 0, y: 15, duration: 0.7 }, "-=0.4")
              .from(".quote-card", { opacity: 0, y: 40, scale: 0.96, duration: 0.9 }, "-=0.8");
      }

      // Hero background strip subtle parallax
      if ($(".hero-strip")) {
        gsap.to(".hero-strip", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // 2. PRIORITIES BAR
      if ($(".priorities")) {
        gsap.from(".priorities .container", {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".priorities",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      }

      // 3. WHY CHOOSE US
      if ($(".why")) {
        gsap.from(".why-media", {
          opacity: 0,
          x: -40,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".why",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
        gsap.from([".why-content .eyebrow", ".why-content .section-title", ".why-content .lead", ".why-awards"], {
          opacity: 0,
          y: 30,
          stagger: 0.12,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".why-content",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // 4. CORE COVERAGE CARDS
      if ($(".about")) {
        gsap.from(".about-head", {
          opacity: 0,
          y: 30,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-head",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".coverage-card", {
          opacity: 0,
          y: 40,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".coverage-track",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 5. SPECIALTY COVERAGE SLIDER
      if ($(".services-head")) {
        gsap.from(".services-head", {
          opacity: 0,
          y: 30,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".services-head",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
      if ($(".services-viewport")) {
        gsap.from(".service-card", {
          opacity: 0,
          x: 40,
          stagger: 0.08,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".services-viewport",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 6. COMMERCIAL PROPERTIES & BIZ GRID
      if ($(".commercial")) {
        gsap.from(".commercial-content > *", {
          opacity: 0,
          y: 25,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".commercial-grid",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".commercial-media", {
          opacity: 0,
          scale: 0.95,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".commercial-grid",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }
      if ($(".biz-coverage")) {
        gsap.from(".biz-title", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".biz-coverage",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".biz-card", {
          opacity: 0,
          y: 35,
          stagger: 0.08,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".biz-grid",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 7. MORTGAGE PROTECTION
      if ($(".mortgage")) {
        gsap.from(".mortgage-head", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".mortgage-head",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        gsap.from([".mortgage-media", ".mortgage-img"], {
          opacity: 0,
          y: 35,
          stagger: 0.15,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".mortgage-grid",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // 8. MEET JENNIFER HICKMAN
      if ($(".meet")) {
        gsap.from(".meet-content > *", {
          opacity: 0,
          y: 25,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".meet-grid",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".meet-media img", {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".meet-grid",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }

      // 9. OUR PROMISE & FEATURES
      if ($(".promise")) {
        gsap.from(".promise-head", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".promise-head",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".badge-wrap", {
          opacity: 0,
          scale: 0.7,
          rotation: -45,
          duration: 1,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: ".promise-head",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".feature", {
          opacity: 0,
          y: 30,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".promise-features",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // 10. TESTIMONIALS
      if ($(".testimonials")) {
        gsap.from(".testi-head", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".testimonials",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".testi-card", {
          opacity: 0,
          y: 35,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#testiTrack",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 11. SAVINGS ACCORDION CASCADE
      if ($(".savings")) {
        gsap.from(".savings-intro", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".savings-intro",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".saving", {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".savings-list",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 12. READY TO TALK?
      if ($(".talk")) {
        gsap.from(".talk-content > *", {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".talk-grid",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".talk-media", {
          opacity: 0,
          scale: 0.95,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".talk-grid",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // 13. FAQ ACCORDION
      if ($(".faq")) {
        gsap.from(".faq-title", {
          opacity: 0,
          y: 25,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-title",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        gsap.from(".faq-item", {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#faqList",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 14. BOTTOM CTA BANNER
      if ($(".cta")) {
        gsap.from([".cta-title", ".cta p", ".cta .btn"], {
          opacity: 0,
          y: 25,
          stagger: 0.12,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // 15. FOOTER ENTRANCE
      if ($(".site-footer")) {
        const footerTl = gsap.timeline({
          scrollTrigger: {
            trigger: ".site-footer",
            start: "top 88%",
            toggleActions: "play none none none",
          },
          defaults: { ease: "power3.out" },
        });

        footerTl
          .from(".footer-brand", {
            opacity: 0,
            y: 35,
            duration: 0.85,
          })
          .from(
            ".footer-col",
            {
              opacity: 0,
              y: 30,
              stagger: 0.12,
              duration: 0.8,
            },
            "-=0.6"
          )
          .from(
            ".footer-bottom",
            {
              opacity: 0,
              y: 20,
              duration: 0.75,
            },
            "-=0.4"
          );
      }
    }
  }
})();
