export const latest_refraction_template = (refraction) => {
    return ` 
                                <!-- Refraction Summary -->
<div class="shadow-sm mb-3">
    <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between gap-0">
            <div>
                <h5 class="card-title mb-1">Refraction</h5>
                <div class="text-muted small">
                    Latest date: <strong class="latest-refraction-date">${refraction.refraction_date}</strong>
                    &nbsp;&middot;&nbsp;
                    Refractor: <strong class="refractor-name">${refraction.refractor}</strong>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="badge align-middle badge-pill badge-${refraction.type == 'Glasses'? 'success': 'info'} refraction-type">${refraction.type}</span>
            </div>
        </div>

        <hr class="my-3 ${refraction.note? 'd-flex' : 'd-none'} refraction-notes-separator">
        <div class="refraction-notes ${refraction.note? 'd-flex' : 'd-none'}">
            <div class="fw-semibold mb-1">Notes</div>
            <div class="text-wrap notes-text">${refraction.note}</div>
        </div>
    </div>
</div>

<!-- Refraction Details Table -->
<div class="">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-sm align-middle mb-0 p-0 m-0">
                <thead class="table-light">
                    <tr>
                        <th style="width:18ch;">Parameter</th>
                        <th class="text-center" style="width:20ch;">Right Eye (OD)</th>
                        <th class="text-center" style="width:20ch;">Left Eye (OS)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="fw-semibold">Sphere (SPH)</td>
                        <td class="text-center sphere-od">${refraction.right.sph > 0? "+" : ""}${refraction.right.sph}</td>
                        <td class="text-center sphere-os">${refraction.left.sph > 0? "+" : ""}${refraction.left.sph}</td>
                    </tr>
                    <tr>
                        <td class="fw-semibold">Cylinder (CYL)</td>
                        <td class="text-center cylinder-od">${refraction.right.cyl}</td>
                        <td class="text-center cylinder-os">${refraction.left.cyl}</td>
                    </tr>
                    <tr>
                        <td class="fw-semibold">Axis (°)</td>
                        <td class="text-center axis-od">${refraction.right.axis}</td>
                        <td class="text-center axis-os">${refraction.left.axis}</td>
                    </tr>
                    <tr>
                        <td class="fw-semibold">Addition (ADD)</td>
                        <td class="text-center addition-od">+${refraction.right.add}</td>
                        <td class="text-center addition-os">+${refraction.left.add}</td>
                    </tr>
                    <tr>
                        <td class="fw-semibold">VA sc</td>
                        <td class="text-center va-sc-od">${refraction.right.va_sc}</td>
                        <td class="text-center va-sc-os">${refraction.left.va_sc}</td>
                    </tr>
                    <tr>
                        <td class="fw-semibold">VA cc</td>
                        <td class="text-center va-cc-od">${refraction.right.va_cc}</td>
                        <td class="text-center va-cc-os">${refraction.left.va_cc}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Optional legend -->
        <div class="mt-3 small text-muted">
            <span class="me-3"><strong>OD</strong> Right Eye</span>
            <span class="me-3"><strong>OS</strong> Left Eye</span>
            <span class="me-3"><strong>VA sc</strong> Visual Acuity, without correction</span>
            <span class="me-3"><strong>VA cc</strong> Visual Acuity, with correction</span>
        </div>
    </div>
</div>
<button class="btn btn-primary btn-sm btn-enter-prescription">Enter Prescription</button>
<button class="btn btn-primary btn-sm btn-previouse-prescriptions">Previouse Prescriptions</button>
<button class="btn btn-primary btn-sm btn-print-prescritption">Print Prescription</button>
                                `;
}

export const empty_template = () => {
    return `
    <div class="text-center text-muted mt-3">
        <p class="mb-3">No prescription data available.</p>
        <button class="btn btn-primary btn-sm btn-enter-prescription">Enter Prescription</button>
    </div>
    `;
}

if (typeof window !== 'undefined') {
    window.latest_refraction_template = latest_refraction_template;
    window.empty_template = empty_template;
}else{
    console.warn("window is not defined");
}