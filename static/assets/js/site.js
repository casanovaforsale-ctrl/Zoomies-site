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
})();
