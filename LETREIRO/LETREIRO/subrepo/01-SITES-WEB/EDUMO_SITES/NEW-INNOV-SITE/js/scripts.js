// ============================================
// INNOVPLAY - INTERACTIVE FEATURES
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // ============================================
  // SMOOTH SCROLL NAVIGATION
  // ============================================
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

  smoothScrollLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || !href) return;

      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerOffset = 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // ============================================
  // MOBILE HAMBURGER MENU
  // ============================================
  const createMobileMenu = () => {
    const navContainer = document.querySelector(".nav-container");
    const navLinks = document.querySelector(".nav-links");

    if (!navContainer || !navLinks) return;

    // Create hamburger button if it doesn't exist
    let hamburger = document.querySelector(".hamburger-menu");
    if (!hamburger) {
      hamburger = document.createElement("button");
      hamburger.className = "hamburger-menu";
      hamburger.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
      navContainer.insertBefore(hamburger, navLinks);
    }

    // Toggle menu
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !navContainer.contains(e.target) &&
        navLinks.classList.contains("active")
      ) {
        navLinks.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.classList.remove("menu-open");
      }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.classList.remove("menu-open");
      });
    });
  };

  createMobileMenu();

  // ============================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================
  const revealOnScroll = () => {
    const reveals = document.querySelectorAll(
      ".reveal, .feature-card, .stat-item, .team-member, .timeline-item",
    );

    reveals.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;

      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add("revealed");
      }
    });
  };

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll(); // Initial check

  // ============================================
  // ANIMATED COUNTER
  // ============================================
  const animateCounters = () => {
    const counters = document.querySelectorAll(".counter");

    counters.forEach((counter) => {
      if (counter.classList.contains("counted")) return;

      const elementTop = counter.getBoundingClientRect().top;
      if (elementTop < window.innerHeight - 100) {
        counter.classList.add("counted");

        const target = parseInt(counter.getAttribute("data-target"));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.floor(current).toLocaleString("pt-BR");
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString("pt-BR");
          }
        };

        updateCounter();
      }
    });
  };

  window.addEventListener("scroll", animateCounters);
  animateCounters(); // Initial check

  // ============================================
  // TESTIMONIALS CAROUSEL
  // ============================================
  const initCarousel = () => {
    const carousel = document.querySelector(".testimonials-carousel");
    if (!carousel) return;

    const track = carousel.querySelector(".testimonials-track");
    const slides = carousel.querySelectorAll(".testimonial-slide");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    const slideCount = slides.length;

    // Create dots
    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "carousel-dot";
        if (index === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goToSlide(index));
        dotsContainer.appendChild(dot);
      });
    }

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;

      // Update dots
      const dots = dotsContainer?.querySelectorAll(".carousel-dot");
      dots?.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlide);
      });
    };

    const goToSlide = (index) => {
      currentSlide = index;
      updateCarousel();
    };

    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % slideCount;
      updateCarousel();
    };

    const prevSlide = () => {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateCarousel();
    };

    // Auto-rotate
    let autoRotate = setInterval(nextSlide, 5000);

    // Pause on hover
    carousel.addEventListener("mouseenter", () => {
      clearInterval(autoRotate);
    });

    carousel.addEventListener("mouseleave", () => {
      autoRotate = setInterval(nextSlide, 5000);
    });

    // Navigation buttons
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");

    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  };

  initCarousel();

  // ============================================
  // FAQ ACCORDION
  // ============================================
  const initAccordion = () => {
    const accordionItems = document.querySelectorAll(".faq-item");

    accordionItems.forEach((item) => {
      const question = item.querySelector(".faq-question");

      if (question) {
        question.addEventListener("click", () => {
          const isActive = item.classList.contains("active");

          // Close all items
          accordionItems.forEach((i) => i.classList.remove("active"));

          // Open clicked item if it wasn't active
          if (!isActive) {
            item.classList.add("active");
          }
        });
      }
    });
  };

  initAccordion();

  // ============================================
  // FORM VALIDATION
  // ============================================
  const initFormValidation = () => {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const submitBtn = form.querySelector(
        'button[type="submit"], button[type="button"]',
      );

      if (submitBtn) {
        submitBtn.addEventListener("click", (e) => {
          e.preventDefault();

          let isValid = true;
          const inputs = form.querySelectorAll(
            "input[required], textarea[required], select[required]",
          );

          inputs.forEach((input) => {
            const value = input.value.trim();
            const parent = input.parentElement;

            // Remove previous error
            const existingError = parent.querySelector(".error-message");
            if (existingError) existingError.remove();
            input.classList.remove("error");

            // Validate
            if (!value) {
              isValid = false;
              input.classList.add("error");

              const errorMsg = document.createElement("span");
              errorMsg.className = "error-message";
              errorMsg.textContent = "Este campo é obrigatório";
              parent.appendChild(errorMsg);
            } else if (input.type === "email" && !isValidEmail(value)) {
              isValid = false;
              input.classList.add("error");

              const errorMsg = document.createElement("span");
              errorMsg.className = "error-message";
              errorMsg.textContent = "Email inválido";
              parent.appendChild(errorMsg);
            }
          });

          if (isValid) {
            // Show success message
            showFormSuccess(form);
          }
        });
      }
    });
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showFormSuccess = (form) => {
    const successMsg = document.createElement("div");
    successMsg.className = "form-success";
    successMsg.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <p>Mensagem enviada com sucesso! Entraremos em contato em breve.</p>
        `;

    form.insertAdjacentElement("afterend", successMsg);
    form.reset();

    setTimeout(() => {
      successMsg.remove();
    }, 5000);
  };

  initFormValidation();

  // ============================================
  // ACTIVE NAV HIGHLIGHTING
  // ============================================
  const highlightActiveNav = () => {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener("scroll", () => {
      let current = "";

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 150) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.style.color = "";
        const href = link.getAttribute("href");
        if (href === `#${current}`) {
          link.style.color = "var(--neon-blue)";
        }
      });
    });
  };

  if (document.querySelector('.nav-links a[href^="#"]')) {
    highlightActiveNav();
  }

  // ============================================
  // PARALLAX EFFECT
  // ============================================
  const initParallax = () => {
    const parallaxElements = document.querySelectorAll(".parallax");

    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach((element) => {
        const speed = element.getAttribute("data-speed") || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
  };

  initParallax();

  // ============================================
  // LOADING ANIMATION
  // ============================================
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
  });

  // ============================================
  // STICKY HEADER
  // ============================================
  const header = document.querySelector("header");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    lastScroll = currentScroll;
  });
});
