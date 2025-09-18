// Safe loader: makes sure qz-tray.js is loaded and window.qz is ready
function ensureQZReady() {
    return new Promise((resolve) => {
        // Ask Frappe to load qz-tray.js if not loaded
        try { frappe.ui.form.qz_init(); console.log('all good') } catch (e) { console.warn('Frappe QZ init failed', e); }

        // Poll until window.qz exists
        const waitForQZ = () => {
            if (window.qz && typeof qz.security?.setCertificatePromise === 'function') {
                resolve();
            } else {
                setTimeout(waitForQZ, 50);
            }
        };
        waitForQZ();
    });
}

window.optics_erp = window.optics_erp || {};
optics_erp.initQZ = function () {
    console.log('Initializing QZ Tray...');
    // Load the public certificate (codesign.crt)
    qz.security.setCertificatePromise(function (resolve, reject) {
        fetch('/assets/optics_erp/qz-app.crt.txt', {
            cache: 'no-store',
            headers: { 'Content-Type': 'text/plain' }
        })
            .then(r => r.ok ? r.text() : Promise.reject('Failed to load cert'))
            .then(resolve).catch(reject);
    });

    // Use SHA-256 since our server signs with SHA-256
    qz.security.setSignatureAlgorithm('SHA256');

    // Ask our Frappe endpoint to sign the message
    // qz.security.setSignaturePromise(function (toSign) {
    //     return function (resolve, reject) {
    //         frappe.call({
    //             method: 'optics_erp.api.qz_sign.qz_sign',
    //             args: { toSign },
    //             freeze: false
    //         }).then(r => resolve(r.message))
    //             .catch(reject);
    //     };
    // });
};

// Call this ONCE on page build (not inside click handlers)
ensureQZReady().then(() => {
    optics_erp.initQZ();
});