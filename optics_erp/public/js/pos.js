frappe.provide('erpnext.PointOfSale');

Promise.all([
    frappe.require('point-of-sale.bundle.js'),
    frappe.require('pos_extend.bundle.js')
]).then(() => {
    // Extend the standard POS Controller
    erpnext.PointOfSale.Controller = class POSWithOptics extends erpnext.PointOfSale.Controller {
        constructor(wrapper) {
            super(wrapper);
        }

        prepare_dom() {
            super.prepare_dom();
            // this.wrapper.append(`<section class="custom-po"></section>`);
            // this.$custome_po = this.wrapper.find(".custom-po");
            // this.$custome_po.append(`<div class="optical-prescription-section" style="margin-top: 16px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            //     <h4>Optical Prescription</h4>
            //     <button class="btn btn-primary btn-sm btn-enter-prescription">Enter Prescription</button>
            // </div>`);

            // this.$custome_po.find('.btn-enter-prescription').on('click', alert('Enter Prescription clicked') );

        }
        // override menu preparation and add your own buttons
        prepare_menu() {
            // call base method
            super.prepare_menu();
            // add custom button
            // this.page.add_menu_item(__('Optical Prescription'), this.open_optical_dialog.bind(this));
        }


        // your custom method – for example, collect lens prescription details

    };

    //Extend pos_item_cart to show customer details
    erpnext.PointOfSale.ItemCart = class ItemCartWithCustomerDetails extends erpnext.PointOfSale.ItemCart {
        constructor(wrapper, pos) {
            super(wrapper, pos);
            console.log('ItemCartWithCustomerDetails constructor');
        }

        toggle_customer_info(show) {
            super.toggle_customer_info(show);

            if (show) {
                // Add custom customer details section
                const { customer } = this.customer_info || {};
                if (!customer) return;
                const $customer_form = this.$customer_section.find(".customer-fields-container")

                $customer_form.after(
                    `<div class="oerp-customer-rx" style="overflow: scrole; overflow-x: hidden;  margin-right: -12px; margin-left: -10px; scrollbar-width: thin; max-height: 300px; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px;"></div>`
                );

                // Fetch latest refraction data from server per customer
                frappe.call({
                    method: 'optics_erp.api.pos_refraction.get_latest_refraction',
                    args: { customer },
                    freeze: false,
                    callback: (r) => {
                        if (r) {
                            const rx = r.message;
                            if (rx.name) {
                                const rx_template = window.latest_refraction_template(rx);
                                const $customer_rx = this.$customer_section.find(".oerp-customer-rx")
                                $customer_rx.append(rx_template);

                            } else {
                                const empty_template = window.empty_template();
                                const $customer_rx = this.$customer_section.find(".oerp-customer-rx")
                                $customer_rx.append(empty_template);
                            }

                            this.$customer_rx = this.$customer_section.find('.oerp-customer-rx');
                            this.$customer_rx.find('.btn-enter-prescription').on('click', () => { this.open_optical_dialog(customer) });
                            this.$customer_rx.find('.btn-previouse-prescriptions').on('click', () => { this.open_previouse_prescriptions_dialog() });
                            this.$customer_rx.find('.btn-print-prescritption').on('click', () => { this.open_prescritption_print_dialog() });
                        }
                    }
                });



                // $customer_form.find('.btn-enter-prescription').on('click', alert('Enter Prescription clicked') );
            }
        }

        open_optical_dialog(customer) {
            console.log('Open Optical Dialog');
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
                    field.$input.attr('min', '0.1');
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
            console.log('Open Previouse Prescriptions Dialog');
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
                    console.log(rx);
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
            console.log('Open Prescription Print Dialog');
            const d = new frappe.ui.Dialog({
                title: __('Print Prescription'),
                fields: [
                    { label: __('Select Prescription'), fieldname: 'refraction', fieldtype: 'Link', options: 'Refraction', reqd: 1 },
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
                            colorType: 'grayscale'
                        });
                        // const url = this.refractionPrintUrl(values.refraction)
                        const html_temp = await this.loadPrintHtml(values.refraction, '80mm html');
                        console.log(html_temp);
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
                _lang: frappe.boot.user_lang || frappe.boot.lang || 'en'
            });
            return `${base}/printview?${qs.toString()}`;
        }

        async loadPrintHtml(name, format) {
            const url = this.refractionPrintUrl(name, format);
            console.log(`Loading print HTML from ${url}`);
            const res = await fetch(url, { credentials: 'include' }); // send cookies/session
            if (!res.ok) throw new Error(`Failed to load print HTML (${res.status})`);
            return await res.text();
        }   
}
});