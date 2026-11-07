/* The Zephyr Zoomie Zone. No libraries, no trackers. */
(function () {
  "use strict";
  // Paste a Formspree form ID to deliver the contact form by email.
  // Left empty, the form opens the visitor's email app instead.
  var CONFIG = { formspreeId: "", email: "casanovaforsale@gmail.com" };
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var trail = document.querySelector(".trail"), zoomer = document.querySelector(".zoomer");
  if (trail && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      trail.classList.add("go");
      if (zoomer && !calm) zoomer.classList.add("run");
      io.disconnect();
    }, { threshold: 0.6 });
    io.observe(trail);
  } else if (trail) trail.classList.add("go");

  var q = document.querySelector(".quote img");
  if (q && !calm) {
    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var r = q.parentNode.getBoundingClientRect(), k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        q.style.transform = "scale(1.12) translateY(" + (k * -40).toFixed(1) + "px)";
        tick = false;
      });
    }, { passive: true });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.elements.company.value) return;
      var d = { name: form.elements.name.value, email: form.elements.email.value, phone: form.elements.phone.value, message: form.elements.message.value };
      if (CONFIG.formspreeId) {
        status.textContent = "Sending…";
        fetch("https://formspree.io/f/" + CONFIG.formspreeId, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { if (!r.ok) throw 0; form.reset(); status.className = "form-status ok"; status.textContent = "Message Sent"; })
          .catch(function () { status.textContent = "That did not go through. Please email " + CONFIG.email + "."; });
      } else {
        location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent("Zoomie Zone question from " + d.name) + "&body=" + encodeURIComponent("Name: " + d.name + "\nPhone: " + d.phone + "\nEmail: " + d.email + "\n\n" + d.message);
        status.className = "form-status ok";
        status.textContent = "Your email app should open with the message filled in. If it does not, email " + CONFIG.email + ".";
      }
    });
  }
  /* Product videos. A card's "Watch video" button plays the clip in a pop-up
     player; Esc, Close or a tap outside closes it and stops the sound. */
  var plays = document.querySelectorAll(".card-play");
  if (plays.length) {
    var dlg = document.createElement("dialog");
    if (typeof dlg.showModal !== "function") {
      Array.prototype.forEach.call(plays, function (b) {
        b.addEventListener("click", function () { location.href = b.getAttribute("data-video"); });
      });
    } else {
      dlg.className = "vid";
      dlg.setAttribute("aria-labelledby", "vid-cap");
      dlg.innerHTML = '<div class="vid-box"><video controls playsinline preload="none"></video>' +
        '<p class="vid-cap" id="vid-cap"></p><div class="vid-row">' +
        '<a class="btn btn-sm vid-buy" target="_blank" rel="noopener">See it on TikTok Shop</a>' +
        '<button class="btn btn-sm btn-ghost vid-x" type="button" autofocus>Close</button></div></div>';
      document.body.appendChild(dlg);
      var vid = dlg.querySelector("video"), cap = dlg.querySelector(".vid-cap"), buy = dlg.querySelector(".vid-buy"),
        root = document.documentElement, opener = null, openedAt = 0, pressedOutside = false;
      var shut = function () { if (dlg.open) dlg.close(); };
      dlg.querySelector(".vid-x").addEventListener("click", shut);
      vid.addEventListener("error", function () {
        if (dlg.open && vid.getAttribute("src")) cap.textContent = "This video won't load right now. It's also on the TikTok Shop page.";
      });
      // Close on a tap outside the player, but only when the press started there too and
      // not on the second click of a double-click on "Watch video" (the backdrop covers it).
      dlg.addEventListener("pointerdown", function (e) { pressedOutside = e.target === dlg; });
      // The rest of a double-click or double-tap on "Watch video" can land on Close or the
      // TikTok link once the player is open; swallow it (the video's own controls excepted).
      dlg.addEventListener("click", function (e) {
        if (e.target !== vid && (e.detail > 1 || Date.now() - openedAt < 400)) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg && pressedOutside && e.detail < 2 && Date.now() - openedAt > 400) shut();
        pressedOutside = false;
      });
      // Going to TikTok, or leaving the tab, stops the clip so its sound doesn't play on.
      buy.addEventListener("click", function (e) { if (!(e.ctrlKey || e.metaKey || e.shiftKey)) shut(); });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && dlg.open && document.pictureInPictureElement !== vid) vid.pause();
      });
      dlg.addEventListener("close", function () {
        vid.pause(); vid.removeAttribute("src"); vid.removeAttribute("poster"); vid.load();
        root.classList.remove("vid-open");
        if (opener) opener.focus();
      });
      Array.prototype.forEach.call(plays, function (b) {
        b.addEventListener("click", function () {
          opener = b;
          cap.textContent = b.getAttribute("data-title") || "";
          buy.href = b.getAttribute("data-href") || "#shop";
          vid.poster = b.getAttribute("data-poster") || "";
          vid.src = b.getAttribute("data-video");
          root.classList.add("vid-open");
          dlg.showModal();
          openedAt = Date.now();
          var go = vid.play();
          if (go && go.catch) go.catch(function () {});
        });
      });
    }
  }

  /* Cookie choice. Analytics (if a gaId is set) loads only after Accept. */
  var GA_ID = "";
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  var loadAnalytics = function () {
    if (!GA_ID || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", GA_ID);
  };
  var banner = document.getElementById("cookie"), choice = store.get("cookies");
  if (choice === "yes") loadAnalytics();
  if (banner) {
    if (choice !== "yes" && choice !== "no") banner.hidden = false;
    var decide = function (v) { store.set("cookies", v); banner.hidden = true; if (v === "yes") loadAnalytics(); };
    document.getElementById("cookie-yes").addEventListener("click", function () { decide("yes"); });
    document.getElementById("cookie-no").addEventListener("click", function () { decide("no"); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cookie-open]"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); banner.hidden = false; });
    });
  }
})();
