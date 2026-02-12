/* js/main.js
   Megamen site interactions:
   - Brand bar population
   - Promo modal (session-based)
   - Grid gallery injection (pic0..pic112, mixed extensions)
   - Email form (demo)
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const on = (el, evt, handler, opts) => {
    if (!el) return;
    el.addEventListener(evt, handler, opts);
  };

  // =========================
  // BRAND BAR
  // =========================
  function initBrandBar() {
    const brands = [
      "Ubiquiti", "Sophos", "Fortinet", "Cisco / Meraki", "Aruba", "TP-Link",
      "8x8", "Pax8", "Grandstream",
      "Hikvision", "Wisenet", "Lorex", "Illumivue",
      "CDW", "Ingram", "Dell", "Lenovo", "ADI Global",
    ];

    const track = $("#brandbarTrack");
    if (!track) return;

    if (track.dataset.ready === "1") return;
    track.dataset.ready = "1";

    const list = brands.concat(brands);
    const frag = document.createDocumentFragment();

    for (const name of list) {
      const pill = document.createElement("div");
      pill.className = "brand-logo-pill";
      pill.textContent = name;
      frag.appendChild(pill);
    }

    track.appendChild(frag);
  }

	// =========================
	// HEADER: HIDE EXTRAS ON SCROLL
	// =========================
	function initHeaderScrollCollapse() {
	  const header = document.getElementById("siteHeader");
	  if (!header) return;
	
	  const threshold = header.offsetHeight; // "passed the header"
	
	  const onScroll = () => {
		const scrolledPast = window.scrollY > threshold;
		header.classList.toggle("is-scrolled", scrolledPast);
	  };
	
	  window.addEventListener("scroll", onScroll, { passive: true });
	  window.addEventListener("resize", () => {
		// Re-run in case header height changes
		onScroll();
	  });
	
	  onScroll();
	}


  // =========================
  // PROMO MODAL
  // =========================
	 function initPromoModal() {
	  const modal = $("#promoModal");
	  const closeBtn = $("#promoClose");
	  const promoForm = $("#promoForm");
	
	  // Add BOTH open buttons (header + contact)
	  const openBtns = [
		document.getElementById("openQuote"),
		document.getElementById("openQuoteContact"),
	  ].filter(Boolean);
	
	  if (!modal) return;
	
	  const KEY = "megamen_promo_closed_v1";
	  const OPEN_DELAY_MS = 10_000;
	
	  const open = () => {
		modal.classList.add("open");
		modal.setAttribute("aria-hidden", "false");
	  };
	
	  const close = () => {
		modal.classList.remove("open");
		modal.setAttribute("aria-hidden", "true");
		sessionStorage.setItem(KEY, "1");
	  };
	
	  // Manual open buttons
	  openBtns.forEach((btn) => {
		if (btn.dataset.bound === "1") return;
		btn.dataset.bound = "1";
		btn.addEventListener("click", open);
	  });
	
	  // Auto open (session-based)
	  if (!sessionStorage.getItem(KEY)) {
		window.setTimeout(() => {
		  if (!document.body.contains(modal)) return;
		  open();
		}, OPEN_DELAY_MS);
	  }
	
	  on(closeBtn, "click", close);
	
	  on(modal, "click", (e) => {
		if (e.target === modal) close();
	  });
	
	  on(window, "keydown", (e) => {
		if (e.key === "Escape" && modal.classList.contains("open")) close();
	  });
	
	  on(promoForm, "submit", (e) => {
		e.preventDefault();
		close();
		alert("Thanks! We’ll reach out soon.");
		promoForm.reset();
	  });
	}



  // =========================
  // GRID GALLERY
  // =========================
  function initGridGallery() {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    if (grid.dataset.ready === "1") return;
    grid.dataset.ready = "1";

    const IMAGE_PATH = "images"; // beside index.html
    const START = 0;
    const END = 112;

    // Try common extensions in order
    const EXTS = ["jpg", "JPG", "jpeg", "png", "webp"];

    const makeTile = (i) => {
      const tile = document.createElement("div");
      tile.className = "gallery-tile";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `Gallery image ${i}`;

      let extIndex = 0;

      const setSrc = () => {
        img.src = `${IMAGE_PATH}/pic${i}.${EXTS[extIndex]}`;
      };

      img.addEventListener("error", () => {
        extIndex += 1;
        if (extIndex < EXTS.length) setSrc();
        else tile.remove();
      });

      setSrc();
      tile.appendChild(img);
      return tile;
    };

    const frag = document.createDocumentFragment();
    for (let i = START; i <= END; i++) frag.appendChild(makeTile(i));
    grid.appendChild(frag);
  }

 	// =========================
	// EMAIL FORM → MAILTO (anti-spam)
	// =========================
	const formLoadedAt = Date.now();
	
	function initEmailForm() {
	  const form = $("#emailForm");
	  const emailInput = $("#emailInput");
	  const hp = document.getElementById("company"); // honeypot (optional)
	  if (!form || !emailInput) return;
	
	  on(form, "submit", (e) => {
		e.preventDefault();
	
		// 1) Honeypot
		if (hp && hp.value.trim() !== "") return;
	
		// 2) Time trap
		if (Date.now() - formLoadedAt < 2000) return;
	
		// 3) Cooldown
		const last = Number(localStorage.getItem("signup_last") || "0");
		if (Date.now() - last < 30000) return;
		localStorage.setItem("signup_last", String(Date.now()));
	
		const userEmail = emailInput.value.trim();
		if (!userEmail) return;
	
		const subject = encodeURIComponent("[WEBSITE] Mailing List Signup");
		const body = encodeURIComponent(
		  `Please add this email to the mailing list:\n\n${userEmail}`
		);
	
		window.location.href = `mailto:security@megamen.ca?subject=${subject}&body=${body}`;
		form.reset();
	  });
	}

	// =========================
	// COLLAPSIBLE GALLERY (starts collapsed, 1 row always visible + end tile)
	// =========================
	function initGalleryCollapse() {
	  const btn = document.getElementById("galleryToggle");
	  const body = document.getElementById("galleryBody");
	  const grid = document.getElementById("galleryGrid");
	  if (!btn || !body || !grid) return;
	
	  const getPx = (v) => Number(String(v || "0").replace("px", "")) || 0;
	
	  // --- Add an "end tile" that appears only when expanded
	  const ensureEndTile = () => {
		if (grid.querySelector(".gallery-end-tile")) return;
	
		const tile = document.createElement("div");
		tile.className = "gallery-tile gallery-end-tile";
		tile.innerHTML = `
		  <div>
			<div class="end-actions">
			  <button type="button" class="btn-link" id="galleryCollapseBtn">Hide Gallery</button>
			</div>
		  </div>
		`;
		grid.appendChild(tile);
	  };
	
	  const computePeekHeight = () => {
		const firstTile = grid.querySelector(".gallery-tile");
		if (!firstTile) return 0;
	
		const tileH = firstTile.getBoundingClientRect().height;
	
		const cs = getComputedStyle(grid);
		const padTop = getPx(cs.paddingTop);
		const padBottom = getPx(cs.paddingBottom);
	
		return Math.ceil(padTop + tileH + padBottom + 1);
	  };
	
	  const setButton = (collapsed) => {
		btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
		btn.textContent = collapsed ? "Show" : "Hide";
	  };
	
	  const animateHeight = (toHeight) => {
		const from = body.getBoundingClientRect().height;
		body.style.height = `${from}px`;
		body.offsetHeight; // force reflow
		body.style.height = `${toHeight}px`;
	
		const onEnd = (e) => {
		  if (e.propertyName !== "height") return;
		  body.removeEventListener("transitionend", onEnd);
	
		  // Expanded: allow natural resizing
		  if (!body.classList.contains("is-collapsed")) {
			body.style.height = "auto";
		  }
		};
		body.addEventListener("transitionend", onEnd);
	  };
	
	  const collapse = () => {
		const peek = computePeekHeight();
		body.classList.add("is-collapsed");
		setButton(true);
		animateHeight(peek);
	  };
	
	  const expand = () => {
		ensureEndTile(); // only matters when expanded
		body.classList.remove("is-collapsed");
		setButton(false);
		const target = body.scrollHeight;
		animateHeight(target);
	
		// Wire the "Hide Gallery" button inside the end tile
		const collapseBtn = document.getElementById("galleryCollapseBtn");
		if (collapseBtn && !collapseBtn.dataset.bound) {
		  collapseBtn.dataset.bound = "1";
		  collapseBtn.addEventListener("click", collapse);
		}
	  };
	
	  // Start collapsed ALWAYS (but wait for gallery tiles to exist)
	  const startCollapsed = () => {
		// End tile should NOT exist in collapsed view, so don't create it here
		collapse();
	  };
	
	  // Run now and after load (for accurate heights once images load)
	  startCollapsed();
	  window.addEventListener("load", startCollapsed);
	
	  // Recompute peek height on resize
	  window.addEventListener("resize", () => {
		if (body.classList.contains("is-collapsed")) collapse();
	  });
	
	  // Toggle button
	  btn.addEventListener("click", () => {
		const isCollapsed = body.classList.contains("is-collapsed");
		if (isCollapsed) expand();
		else collapse();
	  });
	}



  // =========================
  // BOOT
  // =========================
  function boot() {
    initBrandBar();
	initHeaderScrollCollapse();
    initPromoModal();
    initGridGallery();
	initGalleryCollapse();
    initEmailForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
