frappe.provide('erpnext.PointOfSale');

Promise.all([
    frappe.require('point-of-sale.bundle.js'), // Ensure POS is loaded
    frappe.require('pos_extend.bundle.js'),
]).then(() => {
    if (typeof frappe === 'undefined' || typeof frappe.require !== 'function') {
        console.warn('[Optics ERP] Frappe is unavailable; skipping the POS extension.');
        return;
    }

    frappe.provide('erpnext.PointOfSale');

    Promise.all([
        frappe.require('point-of-sale.bundle.js'),
        frappe.require('pos_extend.bundle.js'),
    ]).then(() => {
        const BaseItemCart = window.erpnext?.PointOfSale?.ItemCart;

        if (typeof BaseItemCart !== 'function') {
            console.warn('[Optics ERP] ERPNext POS ItemCart is unavailable; skipping the POS extension.');
            return;
        }

        // Page assets can be evaluated more than once during development.
        if (BaseItemCart.__opticsErpCustomerRxExtension) {
            return;
        }

        class ItemCartWithCustomerDetails extends BaseItemCart {
            constructor(...args) {
                super(...args);
                this._customer_rx_request_id = 0;
                this.bind_customer_invoice_handler();
            }

            bind_customer_invoice_handler() {
                if (!this.$customer_section?.off || !this.$customer_section?.on) {
                    return;
                }

                this.$customer_section
                    .off('click.oerpCustomerInvoice', '.invoice-wrapper')
                    .on('click.oerpCustomerInvoice', '.invoice-wrapper', (event) => {
                        event.preventDefault();

                        const invoice_name = $(event.currentTarget).data('invoiceName');
                        const show_transaction_dialog =
                            window.optics_erp?.pos?.show_transaction_dialog;

                        if (invoice_name && typeof show_transaction_dialog === 'function') {
                            show_transaction_dialog(invoice_name);
                        }
                    });
            }

            ensure_customer_rx_section() {
                if (!this.$customer_section?.find) {
                    return null;
                }

                const $existing_sections =
                    this.$customer_section.find('.oerp-customer-rx');
                let $customer_rx = $existing_sections.first();

                // Clean up duplicates left by an older version of the extension.
                if ($existing_sections.length > 1) {
                    $existing_sections.slice(1).remove();
                }

                if (!$customer_rx.length) {
                    const $customer_form = this.$customer_section
                        .find('.customer-fields-container')
                        .first();

                    if (!$customer_form.length) {
                        return null;
                    }

                    $customer_rx = $('<div>', {
                        class: 'oerp-customer-rx',
                    }).css({
                        overflow: 'auto',
                        'overflow-x': 'hidden',
                        'margin-right': '-12px',
                        'margin-left': '-10px',
                        'scrollbar-width': 'thin',
                        'max-height': '300px',
                        'border-top': '1px solid #ddd',
                        'padding-top': '8px',
                        'margin-top': '8px',
                    });
                    $customer_form.after($customer_rx);
                }

                this.$customer_rx = $customer_rx;
                this.bind_customer_rx_handlers();
                return $customer_rx;
            }

            bind_customer_rx_handlers() {
                if (!this.$customer_rx?.off || !this.$customer_rx?.on) {
                    return;
                }

                this.$customer_rx
                    .off('.oerpCustomerRx')
                    .on(
                        'click.oerpCustomerRx',
                        '.btn-enter-prescription',
                        () => {
                            const customer = this.customer_info?.customer;
                            if (customer) {
                                this.open_optical_dialog(customer);
                            }
                        }
                    )
                    .on(
                        'click.oerpCustomerRx',
                        '.btn-previouse-prescriptions',
                        () => this.open_previouse_prescriptions_dialog()
                    )
                    .on(
                        'click.oerpCustomerRx',
                        '.btn-print-prescritption',
                        () => this.open_prescritption_print_dialog()
                    );
            }

            render_customer_rx($customer_rx, rx = {}) {
                const has_refraction = Boolean(rx?.name);
                const template = has_refraction
                    ? window.latest_refraction_template
                    : window.empty_template;

                if (typeof template !== 'function') {
                    console.warn('[Optics ERP] POS refraction template is unavailable.');
                    $customer_rx.empty();
                    return;
                }

                $customer_rx.html(template(rx));
            }

            toggle_customer_info(show) {
                super.toggle_customer_info(show);

                if (!show) {
                    // Invalidate any response still in flight for a closed panel.
                    this._customer_rx_request_id += 1;
                    return;
                }

                const { customer } = this.customer_info || {};
                if (!customer) {
                    return;
                }

                const $customer_rx = this.ensure_customer_rx_section();
                if (!$customer_rx) {
                    console.warn('[Optics ERP] POS customer panel is unavailable.');
                    return;
                }

                const request_id = ++this._customer_rx_request_id;
                $customer_rx.empty();

                frappe.call({
                    method: 'optics_erp.api.pos_refraction.get_latest_refraction',
                    args: { customer },
                    freeze: false,
                    callback: (response) => {
                        const current_customer = this.customer_info?.customer;
                        const is_current_request =
                            request_id === this._customer_rx_request_id &&
                            current_customer === customer;

                        if (!is_current_request || !$customer_rx.closest('body').length) {
                            return;
                        }

                        this.render_customer_rx(
                            $customer_rx,
                            response?.message || {}
                        );
                    },
                    error: () => {
                        const current_customer = this.customer_info?.customer;
                        const is_current_request =
                            request_id === this._customer_rx_request_id &&
                            current_customer === customer;

                        if (is_current_request && $customer_rx.closest('body').length) {
                            this.render_customer_rx($customer_rx);
                        }
                    },
                });
            }

        open_optical_dialog(customer) {
            // console.log('Open Optical Dialog');
            frappe.new_doc('Refraction', { customer }, (qe_dialog) => {
                const PatientField = qe_dialog.get_field('customer');
                PatientField.set_value(customer);
                PatientField.$input.prop('disabled', true);

                const refraction_dateField = qe_dialog.get_field('refraction_date');
                refraction_dateField.set_value(frappe.datetime.get_today());

                const refraction_expiary_dateField = qe_dialog.get_field('expiry_date');
                refraction_expiary_dateField.set_value(frappe.datetime.add_days(frappe.datetime.nowdate(), 365));

                const sphere_fields = ['right_sph', 'left_sph'];
                sphere_fields.forEach(fieldname => {
                    const field = qe_dialog.get_field(fieldname);
                    field.$input.prop('type', 'number');
                    field.$input.attr('step', '0.25');
                    field.$input.attr('min', '-20');
                    field.$input.attr('max', '20');
                    field.$input.on('change', () => {
                        let val = parseFloat(field.get_value());
                        if (isNaN(val)) return;
                        // Round to nearest 0.25
                        val = Math.round(val * 4) / 4;
                        field.set_value(val.toFixed(2));
                    });
                });

                const cyl_fields = ['right_cyl', 'left_cyl'];
                cyl_fields.forEach(fieldname => {
                    const field = qe_dialog.get_field(fieldname);
                    field.$input.prop('type', 'number');
                    field.$input.attr('step', '0.25');
                    field.$input.attr('min', '-6');
                    field.$input.attr('max', '0');
                    field.$input.on('change', () => {
                        let val = parseFloat(field.get_value());
                        if (isNaN(val)) return;
                        // Round to nearest 0.25
                        val = Math.round(val * 4) / 4;
                        if (val > 0) val = val * -1; // Ensure CYL is negative or zero
                        field.set_value(val.toFixed(2));
                    });
                });

                const add_fields = ['right_add', 'left_add'];
                add_fields.forEach(fieldname => {
                    const field = qe_dialog.get_field(fieldname);
                    field.$input.prop('type', 'number');
                    field.$input.attr('step', '0.25');
                    field.$input.attr('min', '0');
                    field.$input.attr('max', '4');
                    field.$input.on('change', () => {
                        let val = parseFloat(field.get_value());
                        if (isNaN(val)) return;
                        // Round to nearest 0.25
                        val = Math.round(val * 4) / 4;
                        field.set_value(val.toFixed(2));
                    });
                });

                const axis_fields = ['right_axis', 'left_axis'];
                axis_fields.forEach(fieldname => {
                    const field = qe_dialog.get_field(fieldname);
                    field.$input.prop('type', 'number');
                    field.$input.attr('step', '1');
                    field.$input.attr('min', '0');
                    field.$input.attr('max', '180');
                    field.$input.on('change', () => {
                        let val = parseInt(field.get_value());
                        if (isNaN(val)) return;
                        // Clamp between 0 and 180
                        val = Math.max(0, Math.min(180, val));
                        val > 180 ? 180 : val;
                        field.set_value(val.toFixed(1));
                    });
                });

                const va_fields = ['right_va_sc_decimal', 'left_va_sc_decimal', 'right_va_cc_decimal', 'left_va_cc_decimal']; // VA fields in decimal format
                va_fields.forEach(fieldname => {
                    const field = qe_dialog.get_field(fieldname);
                    field.$input.prop('type', 'number');
                    field.$input.attr('step', '0.05');
                    field.$input.attr('min', '0.0');
                    field.$input.attr('max', '2.0');
                    field.$input.on('change', () => {
                        let val = parseFloat(field.get_value());
                        if (isNaN(val)) return;
                        // Round to nearest 0.05
                        val = Math.round(val * 20) / 20;
                        // Clamp between 0.1 and 2.0
                        val = Math.max(0.1, Math.min(2.0, val));
                        field.set_value(val.toFixed(2));
                    });
                });

                frappe.quick_entry.after_insert = (doc) => {
                    this.update_customer_section(customer);
                    this.toggle_customer_info(false);
                    this.toggle_customer_info(true);
                    frappe.quick_entry.after_insert = null;
                }
            });
        }

        open_previouse_prescriptions_dialog() {
            // console.log('Open Previouse Prescriptions Dialog');
            const d = new frappe.ui.Dialog({
                title: 'Previouse Prescriptions',
                size: 'large',
                primary_action_label: __('Close'),
                primary_action: () => { d.hide(); }
            });

            const $body = $(`<div class="p-3" />`).appendTo(d.$body);
            const render_list = (rows = []) => {
                if (!rows.length) {
                    $body.html(`<div class="text-muted">${__('No refractions found')}</div>`);
                    return;
                }
                const ul = $('<div class="list-group"/>').appendTo($body.empty());

                rows.forEach(r => {
                    const item = $(`
                        <a class="list-group-item list-group-item-action">
                            <div class="d-flex justify-content-between">
                                <div><strong>${frappe.datetime.str_to_user(r.refraction_date || '')}</strong></div>
                                <div class="text-muted">Expiary Date: ${frappe.datetime.str_to_user(r.expiry_date || '')}</div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="small text-muted">${__('Refractionist')}: <strong>${frappe.utils.escape_html(r.refractor || '--')}</strong></div>
                                <span class="align-middle badge badge-pill badge-${frappe.utils.escape_html(r.prescription_type == 'Glasses' ? 'success' : 'info')}">${frappe.utils.escape_html(r.prescription_type)}</span>
                            </div>
                        </a>
                    `).appendTo(ul);
                    item.on('click', () => render_detail(r.name));
                });
            };

            const load_list = () => {
                $body.html(`<div class="text-muted">${__('Loading...')}</div>`);
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Refraction',
                        filters: { customer: this.customer_info.customer },
                        fields: ['name', 'refraction_date', 'refractor', 'expiry_date', 'prescription_type'],
                        order_by: 'refraction_date desc, modified desc',
                        limit_page_length: 10,
                    }
                }).then(r => render_list(r.message || []))
                    .catch(() => $body.html(`<div class="text-danger">${__('Error loading list')}</div>`));
            };

            const render_detail = (name) => {
                $body.html(`<div class="text-muted">${__('Loading...')}</div>`);
                frappe.call({
                    method: 'frappe.client.get',
                    args: { doctype: 'Refraction', name }
                }).then(r => {
                    const rx = r.message || {};

                    const notes = typeof rx.notes === 'string'
                        ? rx.notes.trim()
                        : '';

                    const safe_notes = notes
                        ? frappe.utils.escape_html(notes)
                        : '';
                    // console.log(rx);
                    // A simple detail layout; replace with your template if you have one
                    $body.html(`
                        <div class="mb-2 d-flex justify-content-between align-items-center">
                            <button class="btn btn-secondary btn-sm back-btn">${__('Back')}</button>
                            <span class="badge badge-info">
                                ${rx.prescription_type}
                            </span>
                        </div>

                        <!-- Meta section -->
                        <div class="table-responsive">
                            <table class="table table-sm table-borderless mb-3">
                                <thead class="thead-light">
                                    <tr>
                                        <th colspan="4" class="align-middle">
                                            ${__('Refraction Details')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row" class="w-25">${__('Refraction Date')}</th>
                                        <td class="w-25">${rx.refraction_date || '--'}</td>
                                        <th scope="row" class="w-25">${__('Creation Date')}</th>
                                        <td class="w-25">${rx.creation || '--'}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">${__('Expiry Date')}</th>
                                        <td>${rx.expiry_date || '--'}</td>
                                        <th scope="row">${__('Refractionist')}</th>
                                        <td>${rx.refractor || '--'}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">${__('PD Right')}</th>
                                        <td>${rx.right_pd_mm || '--'}</td>
                                        <th scope="row">${__('PD Left')}</th>
                                        <td>${rx.left_pd_mm || '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        ${safe_notes ? `
                            <!-- Notes section -->
                            <div class="mt-3">
                                <h6 class="mb-1">${__('Notes')}</h6>
                                <div
                                    class="border rounded bg-light p-2 text-wrap"
                                    style="white-space: pre-wrap;"
                                >${safe_notes}</div>
                            </div>
                        ` : ''}
                        <!-- Rx values section -->
                        <div class="table-responsive">
                            <table class="table table-sm table-hover mb-0">
                                <thead class="thead-light">
                                    <tr>
                                        <th class="text-nowrap">${__('Eye')}</th>
                                        <th class="text-nowrap">${__('SPH')}</th>
                                        <th class="text-nowrap">${__('CYL')}</th>
                                        <th class="text-nowrap">${__('Axis')}</th>
                                        <th class="text-nowrap">${__('ADD')}</th>
                                        <th class="text-nowrap">${__('VAsc')}</th>
                                        <th class="text-nowrap">${__('VAcc')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row">${__('Right')}</th>
                                        <td>${rx.right_sph != null ? rx.right_sph : '--'}</td>
                                        <td>${rx.right_cyl != null ? rx.right_cyl : '--'}</td>
                                        <td>${rx.right_axis != null ? rx.right_axis : '--'}</td>
                                        <td>${rx.right_add != null ? rx.right_add : '--'}</td>
                                        <td>${rx.right_va_sc_decimal != null ? rx.right_va_sc_decimal : '--'}</td>
                                        <td>${rx.right_va_cc_decimal != null ? rx.right_va_cc_decimal : '--'}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">${__('Left')}</th>
                                        <td>${rx.left_sph != null ? rx.left_sph : '--'}</td>
                                        <td>${rx.left_cyl != null ? rx.left_cyl : '--'}</td>
                                        <td>${rx.left_axis != null ? rx.left_axis : '--'}</td>
                                        <td>${rx.left_add != null ? rx.left_add : '--'}</td>
                                        <td>${rx.left_va_sc_decimal != null ? rx.left_va_sc_decimal : '--'}</td>
                                        <td>${rx.left_va_cc_decimal != null ? rx.left_va_cc_decimal : '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    `);
                    $body.find('.back-btn').on('click', () => load_list());
                }).catch(() => {
                    $body.html(`<div class="text-danger">${__('Failed to load refraction')}</div>`);
                });
            };

            d.show();
            load_list();
        }

        open_prescritption_print_dialog() {
            // console.log('Open Prescription Print Dialog');
            const d = new frappe.ui.Dialog({
                title: __('Print Prescription'),
                fields: [
                    {
                        label: __('Select Prescription'),
                        fieldname: 'refraction',
                        fieldtype: 'Link',
                        options: 'Refraction',
                        reqd: 1,
                        filters: { customer: this.customer_info.customer },
                    },
                ],
                primary_action_label: __('Print'),
                primary_action: (values) => {
                    frappe.ui.form.qz_connect().then(() => {
                        return qz.printers.find("80mm printer");
                    }).then(async (printer) => {
                        const cfg = qz.configs.create(printer, {
                            units: 'mm',
                            size: { width: 80, height: 0 },
                            margins: 0,
                            jobName: `Print Refraction ${values.refraction}`,
                            scaleContent: false,
                            colorType: 'Default'
                        });
                        // const url = this.refractionPrintUrl(values.refraction)
                        const html_temp = await this.loadPrintHtml(values.refraction, '80mm html');
                        // console.log(html_temp);
                        const data = [{
                            type: 'pixel',
                            format: 'html',
                            flavor: 'plain',
                            data: html_temp
                        }];
                        return qz.print(cfg, data);
                    }).then(frappe.ui.form.qz_success)
                        .catch(frappe.ui.form.qz_fail);
                }
            });

            frappe.db.get_list('Refraction', {
                filters: { customer: this.customer_info.customer },
                fields: ['name'],
                order_by: 'creation desc',
                limit: 1
            }).then(r => {
                if (r.length) {
                    d.set_value('refraction', r[0].name);
                }
            });

            d.show();
        }

        refractionPrintUrl(name, format = '80mm html') {
            const base = frappe.urllib.get_base_url(); // absolute site URL
            const qs = new URLSearchParams({
                doctype: 'Refraction',
                name,
                format,
                no_letterhead: 0,
                show_toolbar: 0,
                _lang: 'en'
            });
            return `${base}/printview?${qs.toString()}`;
        }

        async loadPrintHtml(name, format) {
            const url = this.refractionPrintUrl(name, format);
            // console.log(`Loading print HTML from ${url}`);
            const res = await fetch(url, { credentials: 'include' }); // send cookies/session
            if (!res.ok) throw new Error(`Failed to load print HTML (${res.status})`);
            return await res.text();
        }
    }

        Object.defineProperty(
            ItemCartWithCustomerDetails,
            '__opticsErpCustomerRxExtension',
            { value: true }
        );
        window.erpnext.PointOfSale.ItemCart = ItemCartWithCustomerDetails;
    }).catch((error) => {
        console.error('[Optics ERP] Unable to load the POS extension.', error);
    });
})();