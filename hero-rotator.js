document.addEventListener("DOMContentLoaded", () => {
  const imgs = Array.from(document.querySelectorAll(".hero-bg-rotator img"));
  const caption = document.getElementById("hero-caption");
  if (!imgs.length) return;

  let i = imgs.findIndex(img => img.classList.contains("active"));
  if (i < 0) i = 0;

  function showCaption(img) {
    if (!caption) return;
    caption.classList.remove("active");
    window.setTimeout(() => {
      caption.textContent = img.getAttribute("data-ref") || "";
      caption.classList.add("active");
    }, 400);
  }

  // Set initial caption
  showCaption(imgs[i]);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return; // static first scene only

  window.setInterval(() => {
    imgs[i].classList.remove("active");
    i = (i + 1) % imgs.length;
    imgs[i].classList.add("active");
    showCaption(imgs[i]);
  }, 30000);
});

// Hero photo badge crossfade (independent small rotation)
document.addEventListener("DOMContentLoaded", () => {
  const badgeImgs = Array.from(document.querySelectorAll("#hero-photo-badge img"));
  if (badgeImgs.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let bi = 0;
  window.setInterval(() => {
    badgeImgs[bi].classList.remove("active");
    bi = (bi + 1) % badgeImgs.length;
    badgeImgs[bi].classList.add("active");
  }, 6000);
});
