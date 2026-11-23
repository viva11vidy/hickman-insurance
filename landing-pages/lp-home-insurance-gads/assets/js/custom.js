

 
 $('.service-slider').owlCarousel({
    loop:true,
    margin:30,
    nav:true,
    dots:true,
     autoplay:true,
    autoplayTimeout:2000,
    navText: [
        '<span class="nav-arrow"><i class="fa-solid fa-arrow-left"></i></span>',
        '<span class="nav-arrow"><i class="fa-solid fa-arrow-right"></i></span>'
    ],
    responsive:{
        0:{
            items:1
        },
        600:{
            items:2
        },
        1000:{
            items:2.5
        }
    }
})




  
document.querySelectorAll("#faqAccordion .accordion-collapse").forEach((collapse) => {
    const button = document.querySelector(
        `[data-bs-target="#${collapse.id}"]`
    );
    const icon = button.querySelector(".accordion-icon");

    collapse.addEventListener("show.bs.collapse", () => {
        icon.textContent = "×";
    });

    collapse.addEventListener("hide.bs.collapse", () => {
        icon.textContent = "+";
    });
});



// steps scroll




document.addEventListener("DOMContentLoaded", () => {

    const sec = document.querySelector(".three-steps");
    if (!sec) return;

    const bars = [...sec.querySelectorAll(".dashed-stock")];
    if (!bars.length) return;

    let progress = 0;
    let locked = false;
    let touchY = 0;
    let sectionTop = 0;
    let correcting = false;
    let lastScroll = window.scrollY;

    const total = bars.length * 100;
    const speed = 0.25;

    // Fill progress
    const paint = () => {

        bars.forEach((bar, i) => {

            const value = Math.max(
                0,
                Math.min(100, progress - i * 100)
            );

            bar.style.setProperty(
                "--step-progress",
                value.toFixed(1) + "%"
            );

        });

    };

    // Get section position
    const getSectionPosition = () => {

        sectionTop =
            sec.getBoundingClientRect().top + window.scrollY;

    };

    // Lock section
    const lockSection = () => {

        getSectionPosition();

        locked = true;
        lastScroll = sectionTop;

        correcting = true;

        window.scrollTo({
            top: sectionTop,
            behavior: "instant"
        });

        requestAnimationFrame(() => {
            correcting = false;
            lastScroll = window.scrollY;
        });

    };

    // Update progress
    const updateProgress = (delta) => {

        progress = Math.max(
            0,
            Math.min(total, progress + delta * speed)
        );

        paint();

        // Release after complete
        if (progress >= total) {
            locked = false;
        }

        // Release when scrolling backwards
        if (progress <= 0 && delta < 0) {
            locked = false;
        }

    };

    // Mouse wheel
    window.addEventListener("wheel", (e) => {

        if (locked) {

            e.preventDefault();

            updateProgress(e.deltaY);
            return;

        }

        if (e.deltaY > 0 && progress < total) {

            const rect = sec.getBoundingClientRect();

            if (rect.top <= 0 && rect.bottom > 0) {

                e.preventDefault();

                lockSection();
                updateProgress(e.deltaY);

            }

        }

    }, { passive: false });

    // Mobile touch start
    window.addEventListener("touchstart", (e) => {

        touchY = e.touches[0].clientY;

    }, { passive: true });

    // Mobile touch move
    window.addEventListener("touchmove", (e) => {

        const currentY = e.touches[0].clientY;
        const delta = (touchY - currentY) * 2;

        touchY = currentY;

        if (locked) {

            e.preventDefault();
            updateProgress(delta);
            return;

        }

        if (delta > 0 && progress < total) {

            const rect = sec.getBoundingClientRect();

            if (rect.top <= 0 && rect.bottom > 0) {

                e.preventDefault();

                lockSection();
                updateProgress(delta);

            }

        }

    }, { passive: false });

    // Scrollbar drag handling
    window.addEventListener("scroll", () => {

        const currentScroll = window.scrollY;

        if (correcting) {
            lastScroll = currentScroll;
            return;
        }

        if (locked) {

            const delta = currentScroll - sectionTop;

            if (Math.abs(delta) > 1) {

                updateProgress(delta);

                if (locked) {

                    correcting = true;

                    window.scrollTo({
                        top: sectionTop,
                        behavior: "instant"
                    });

                    requestAnimationFrame(() => {

                        correcting = false;
                        lastScroll = window.scrollY;

                    });

                } else {

                    lastScroll = currentScroll;

                }

            }

        } else {

            lastScroll = currentScroll;

        }

    }, { passive: true });

    paint();

});











// scroll to top btn
const scrollToTopBtn = document.getElementById("scrollToTop");

window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
        scrollToTopBtn.style.display = "flex";
    } else {
        scrollToTopBtn.style.display = "none";
    }
});

scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// mobile btn
document.addEventListener("DOMContentLoaded", function () {

    const contactSection = document.querySelector(".banner");
    const bottomCall = document.querySelector(".bottom-call");

    if (!contactSection || !bottomCall) return;

    function toggleCallButton() {

        if (window.innerWidth < 768) {

            const sectionBottom = contactSection.getBoundingClientRect().bottom;

            bottomCall.style.display = sectionBottom <= 0 ? "flex" : "none";

        } else {
            bottomCall.style.display = "none";
        }

    }

    window.addEventListener("scroll", toggleCallButton);
    window.addEventListener("resize", toggleCallButton);

    toggleCallButton();

});