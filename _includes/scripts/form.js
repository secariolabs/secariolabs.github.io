(function () {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const statusBox = document.getElementById("contact-form-status");
    const submitBtn = document.getElementById("contact-submit-btn") || form.querySelector('button[type="submit"]');

    // Reset on browser back-forward navigation (bfcache)
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            form.reset();
            if (statusBox) {
                statusBox.style.display = "none";
                statusBox.innerHTML = "";
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Scoping Request";
            }
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Browser built-in validity check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const originalBtnText = submitBtn ? submitBtn.textContent : "Submit Scoping Request";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting Request...";
        }
        if (statusBox) {
            statusBox.style.display = "none";
            statusBox.innerHTML = "";
        }

        const formData = new FormData(form);
        const endpoint = form.getAttribute("action") || "https://getform.io/f/bqoodwyb";

        fetch(endpoint, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json"
            }
        })
        .then(function (response) {
            if (response.ok) {
                form.reset();
                if (statusBox) {
                    statusBox.style.display = "block";
                    statusBox.style.background = "rgba(34, 197, 94, 0.12)";
                    statusBox.style.border = "1px solid rgba(34, 197, 94, 0.35)";
                    statusBox.style.color = "#86efac";
                    statusBox.style.padding = "16px 20px";
                    statusBox.style.borderRadius = "6px";
                    statusBox.style.marginBottom = "20px";
                    statusBox.style.fontSize = "0.95rem";
                    statusBox.style.lineHeight = "1.5";
                    statusBox.innerHTML = "<strong>✓ Scoping Request Received!</strong> Thank you for reaching out to Secario Labs. An experienced security consultant will review your parameters and follow up within 1 business day.";
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Another Request";
                }
            } else {
                throw new Error("Server returned status " + response.status);
            }
        })
        .catch(function (error) {
            console.error("Form submission error:", error);
            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "rgba(239, 68, 68, 0.12)";
                statusBox.style.border = "1px solid rgba(239, 68, 68, 0.35)";
                statusBox.style.color = "#fca5a5";
                statusBox.style.padding = "16px 20px";
                statusBox.style.borderRadius = "6px";
                statusBox.style.marginBottom = "20px";
                statusBox.style.fontSize = "0.95rem";
                statusBox.style.lineHeight = "1.5";
                statusBox.innerHTML = "There was an issue submitting your request. Please try again or reach out directly to <a href='mailto:info@secariolabs.com' style='color:#ffffff; text-decoration:underline;'>info@secariolabs.com</a>.";
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    });
})();
