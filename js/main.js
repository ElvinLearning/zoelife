/* Zoe Life Phase 1 site behaviour.
 *
 * Progressive enhancement only. With JavaScript disabled every page still reads
 * and navigates; the nav is open by default and forms fall back to native
 * browser validation.
 *
 * Forms fail closed whenever an endpoint is absent or rejects a submission.
 * A 2xx response is not enough: the provider payload must explicitly confirm
 * acceptance before the UI reports that a message reached Zoe Life.
 */
(function () {
  "use strict";

  document.documentElement.classList.add("has-js");

  /* ---------------------------------------------------------- mobile nav -- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    // Close on Escape and return focus to the toggle.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------- footer year -- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------ conditional UI -- */
  // Reveals the "tell us more" field only when Other is selected, and makes it
  // required while visible so validation stays honest.
  var reason = document.getElementById("c-reason");
  var reveal = document.querySelector('[data-reveal="Other"]');
  var revealInput = document.getElementById("c-reason-other");

  if (reason && reveal && revealInput) {
    var syncReveal = function () {
      var show = reason.value === "Other";
      reveal.hidden = !show;
      revealInput.required = show;
      if (!show) {
        revealInput.value = "";
        clearError(revealInput);
      }
    };
    reason.addEventListener("change", syncReveal);
    syncReveal();
  }

  /* ---------------------------------------------------------- validation -- */

  var MESSAGES = {
    firstName: "Please enter your first name.",
    lastName: "Please enter your last name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a phone number we can reach you on.",
    reason: "Please choose a reason for contacting us.",
    reasonOther: "Please tell us a little more.",
    message: "Please write a short message.",
    consent: "Please tick the box to confirm you want these emails.",
  };

  function errorNodeFor(field) {
    return document.getElementById(field.id + "-error");
  }

  function clearError(field) {
    field.removeAttribute("aria-invalid");
    var node = errorNodeFor(field);
    if (node) {
      node.textContent = "";
      node.classList.remove("is-shown");
    }
  }

  function showError(field, message) {
    field.setAttribute("aria-invalid", "true");
    var node = errorNodeFor(field);
    if (node) {
      node.textContent = message;
      node.classList.add("is-shown");
    }
  }

  function isValidEmail(value) {
    // Deliberately permissive. The authoritative check is the mail server.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  function validateField(field) {
    var name = field.name;
    var value = field.type === "checkbox" ? field.checked : field.value.trim();

    if (field.required && !value) {
      showError(field, MESSAGES[name] || "This field is required.");
      return false;
    }
    if (name === "email" && value && !isValidEmail(field.value)) {
      showError(field, MESSAGES.email);
      return false;
    }
    if (name === "phone" && value && value.replace(/\D/g, "").length < 7) {
      showError(field, "Please enter a phone number with at least 7 digits.");
      return false;
    }
    if (name === "message" && value && value.length < 10) {
      showError(field, "Please write at least a sentence so we can help.");
      return false;
    }
    clearError(field);
    return true;
  }

  function fieldsOf(form) {
    return Array.prototype.filter.call(
      form.querySelectorAll("input, select, textarea"),
      function (f) {
        // Skip the honeypot and anything inside a hidden conditional block.
        if (f.name === "_honey") return false;
        return f.offsetParent !== null || f.type === "checkbox";
      }
    );
  }

  /* -------------------------------------------------------- form handling -- */

  var CONFIG = window.ZOE_CONFIG || {};

  function endpointFor(kind) {
    return kind === "subscribe" ? CONFIG.newsletterEndpoint : CONFIG.formEndpoint;
  }

  function renderBlocked(status, kind) {
    // Honest terminal state: the submission was NOT delivered anywhere.
    var wording =
      kind === "subscribe"
        ? {
            head: "Mailing list not connected yet",
            body:
              "Your details were not sent and you have not been subscribed. The Zoe Life " +
              "subscriber list is not connected to this site yet. Once it is live, this form " +
              "will confirm your signup properly.",
          }
        : {
            head: "Message not sent",
            body:
              "This form is not connected to the Zoe Life inbox yet, so your message has not " +
              "been delivered and no one has received it. Please do not rely on this form " +
              "until it is live.",
          };

    status.innerHTML =
      '<div class="status-blocked"><strong>' +
      wording.head +
      "</strong>" +
      wording.body +
      "</div>";
  }

  function renderSent(status, kind) {
    // Only ever called after the provider explicitly accepted the submission.
    status.innerHTML =
      '<div class="status-sent"><strong>' +
      (kind === "subscribe" ? "Signup received" : "Message received") +
      "</strong>" +
      (kind === "subscribe"
        ? "Thank you. Your signup request has reached the Zoe Life team. You will hear " +
          "from Zoe Life when there is something worth sharing."
        : "Thank you. Your message has reached the Zoe Life team. Please expect a reply within " +
          "three business days.") +
      "</div>";
  }

  function renderFailed(status, detail) {
    // A real attempt that the server rejected. Never dressed up as success.
    status.innerHTML =
      '<div class="status-blocked"><strong>That did not send</strong>' +
      "Something went wrong on the way, so your message was not delivered. Please try again " +
      "in a moment." +
      (detail ? " (" + detail + ")" : "") +
      "</div>";
  }

  function providerAccepted(payload) {
    return Boolean(payload && (payload.success === true || payload.success === "true"));
  }

  function submitTo(endpoint, form, status, kind, button) {
    var data = new FormData(form);
    var replyTo = form.querySelector('input[name="email"]');
    data.set("form_type", kind === "subscribe" ? "Mailing list signup" : "Contact message");
    data.set(
      "_subject",
      kind === "subscribe" ? "New Zoe Life mailing list signup" : "New Zoe Life website message"
    );
    if (replyTo && replyTo.value) data.set("_replyto", replyTo.value.trim());
    var original = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }
    status.innerHTML = '<p class="status-pending">Sending your message...</p>';

    var done = function () {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    };

    fetch(endpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return null;
          })
          .then(function (payload) {
            done();
            // Success is the provider's explicit word, not the HTTP status alone.
            if (res.ok && providerAccepted(payload)) {
              renderSent(status, kind);
              form.reset();
              if (reason && reveal) {
                reveal.hidden = true;
                revealInput.required = false;
              }
            } else {
              renderFailed(status, "error " + res.status);
            }
          });
      })
      .catch(function (err) {
        done();
        renderFailed(status, err && err.name === "TypeError" ? "network unavailable" : "");
      });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-form]"), function (form) {
    var kind = form.getAttribute("data-form");
    var status = form.querySelector("[data-status]");

    // Re-validate a field once it has been marked invalid, so errors clear as
    // the person fixes them rather than only on the next submit.
    form.addEventListener(
      "input",
      function (e) {
        if (e.target.getAttribute("aria-invalid") === "true") validateField(e.target);
      },
      true
    );

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: silently stop bots without adding friction for people.
      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) return;

      var fields = fieldsOf(form);
      var firstBad = null;

      fields.forEach(function (field) {
        if (!validateField(field) && !firstBad) firstBad = field;
      });

      if (firstBad) {
        // Values are preserved; nothing is cleared on a failed submit.
        if (status) {
          status.innerHTML =
            '<p class="status-error">Please correct the highlighted fields and try again.</p>';
        }
        firstBad.focus();
        return;
      }

      var endpoint = endpointFor(kind);
      if (!endpoint) {
        // Valid input, but there is nowhere to send it. Say so plainly.
        if (status) renderBlocked(status, kind);
        return;
      }
      submitTo(endpoint, form, status, kind, form.querySelector('button[type="submit"]'));
    });
  });
})();
