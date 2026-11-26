// WOW animations
if (typeof WOW !== "undefined") {
    new WOW().init();
}

// Coverage carousel (custom prev/next buttons)
var $coverage = $(".coverage-slider");
$coverage.owlCarousel({
    loop: true,
    margin: 34,
    nav: false,
    dots: false,
    responsive: {
        0: { items: 1.1 },
        600: { items: 2 },
        1000: { items: 3 }
    }
});
$(".coverage-prev").on("click", function () { $coverage.trigger("prev.owl.carousel"); });
$(".coverage-next").on("click", function () { $coverage.trigger("next.owl.carousel"); });

// Bundle carousel: 3.4 cards visible, 5 cards, infinite loop, smooth autoplay + drag
$(".bundle-slider").owlCarousel({
    loop: true,                 // infinite
    margin: 34,
    nav: false,
    dots: false,
    mouseDrag: true,
    touchDrag: true,
    smartSpeed: 900,            // smooth glide
    dragEndSpeed: 700,
    autoplay: true,
    autoplayTimeout: 3200,
    autoplaySpeed: 1100,
    autoplayHoverPause: true,
    responsive: {
        0: { items: 1.15, margin: 16 },
        600: { items: 2.2, margin: 24 },
        1000: { items: 3.4, margin: 34 }
    }
});

// Reviews slider (custom): 2.4 cards visible, one card per click,
// last card ends aligned with the container (space on the right),
// arrows disable at the ends, progress bar follows the position.
(function () {
    var viewport = document.querySelector(".review-viewport");
    var track = document.querySelector(".review-track");
    var fill = document.querySelector(".review-progress-fill");
    var bar = document.querySelector(".review-progress");
    var prev = document.querySelector(".review-prev");
    var next = document.querySelector(".review-next");
    if (!viewport || !track) return;

    var cards = track.querySelectorAll(".item");
    var container = viewport.closest(".container");
    var index = 0, step = 0, maxOffset = 0, offset = 0, totalW = 0, contentW = 0;

    function visibleCount() {
        if (window.innerWidth < 768) return 1.15;
        if (window.innerWidth < 992) return 1.6;
        return 2.4;
    }

    function layout() {
        var gap = window.innerWidth < 768 ? 16 : (window.innerWidth < 992 ? 24 : 40);
        var cs = getComputedStyle(container);
        contentW = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var viewW = viewport.clientWidth;                       // container edge -> screen edge
        var vis = visibleCount();
        var cardW = (viewW - Math.floor(vis) * gap) / vis;      // e.g. 2 full cards + 0.4

        track.style.setProperty("--rv-gap", gap + "px");
        track.style.setProperty("--rv-card", cardW + "px");

        step = cardW + gap;
        totalW = cards.length * cardW + (cards.length - 1) * gap;
        maxOffset = Math.max(0, totalW - contentW);             // last card ends at container's right edge
        go(index, true);
    }

    function maxIndex() {
        return Math.ceil(maxOffset / step - 0.001);
    }

    function go(i, instant) {
        index = Math.max(0, Math.min(i, maxIndex()));
        offset = Math.min(index * step, maxOffset);
        if (instant) track.style.transition = "none";
        track.style.transform = "translateX(" + (-offset) + "px)";
        if (instant) { track.offsetHeight; track.style.transition = ""; }
        update();
    }

    function update() {
        var pct = totalW ? Math.min(100, ((offset + contentW) / totalW) * 100) : 100;
        fill.style.width = pct + "%";
        prev.disabled = offset <= 0;
        next.disabled = offset >= maxOffset - 0.5;
    }

    prev.addEventListener("click", function () { go(index - 1); });
    next.addEventListener("click", function () { go(index + 1); });

    // click on the scrollbar track to jump there
    bar.addEventListener("click", function (e) {
        var r = bar.getBoundingClientRect();
        var ratio = (e.clientX - r.left) / r.width;
        go(Math.round(ratio * maxIndex()));
    });

    // drag / swipe
    var startX = 0, startOffset = 0, dragging = false, moved = 0;
    track.addEventListener("pointerdown", function (e) {
        dragging = true; moved = 0;
        startX = e.clientX; startOffset = offset;
        track.classList.add("dragging");
        track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX; moved = Math.abs(dx);
        var o = Math.max(-60, Math.min(maxOffset + 60, startOffset - dx));
        track.style.transform = "translateX(" + (-o) + "px)";
    });
    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("dragging");
        var dx = e.clientX - startX;
        if (Math.abs(dx) > step * 0.2) {
            go(index + (dx < 0 ? 1 : -1) * Math.max(1, Math.round(Math.abs(dx) / step)));
        } else {
            go(index);
        }
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
})();

// FAQ +/× icons
document.querySelectorAll("#faqAccordion .accordion-collapse").forEach(function (collapse) {
    var button = document.querySelector('[data-bs-target="#' + collapse.id + '"]');
    var icon = button ? button.querySelector(".accordion-icon") : null;
    if (!icon) return;
    collapse.addEventListener("show.bs.collapse", function () { icon.textContent = "×"; });
    collapse.addEventListener("hide.bs.collapse", function () { icon.textContent = "+"; });
});

// Scroll-to-top button + mobile call bar (both animated via CSS classes)
(function () {
    var topBtn = document.getElementById("scrollToTop");
    var callBar = document.querySelector(".bottom-call");
    var quoteForm = document.getElementById("quote-form");

    function onScroll() {
        // call bar: phones only, once the hero quote form has scrolled out of view
        var showCall = false;
        if (callBar && quoteForm && window.innerWidth < 768) {
            showCall = quoteForm.getBoundingClientRect().bottom <= 0;
        }
        if (callBar) callBar.classList.toggle("show", showCall);

        if (topBtn) {
            topBtn.classList.toggle("show", window.scrollY > 300);
            topBtn.classList.toggle("lifted", showCall);
        }
    }

    if (topBtn) {
        topBtn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
})();

// Fixed header: solid background after scrolling
(function () {
    var nav = document.querySelector(".auto-nav");
    if (!nav) return;
    function onScroll() {
        nav.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
})();

// Discount rows on phones: tap to open/close the description, arrow goes to the form
(function () {
    var rows = document.querySelectorAll(".save-row");
    rows.forEach(function (row) {
        row.addEventListener("click", function (e) {
            if (window.innerWidth >= 768) return;
            if (e.target.closest(".save-row-arrow")) return;
            e.preventDefault();
            var isOpen = row.classList.contains("open");
            rows.forEach(function (r) { r.classList.remove("open"); });
            if (!isOpen) row.classList.add("open");
        });
    });
})();
