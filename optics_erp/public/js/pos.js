frappe.provide('erpnext.PointOfSale');

frappe.require('point-of-sale.bundle.js', function () {
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
            // Add custom customer details section
            const $customer_form = this.$customer_section.find(".customer-fields-container")
            $customer_form.after(
                `<div class="oerp-customer-rx">
                    <div class="header">Prescription Details</div>
                    <div class="details">
                        <p>Last Updated: 2023-10-01</p>
                        <p>Refractionist: Dr. Smith</p>
                        <p>Prescription Date: 2023-09-30</p>
                        <p>Expiry Date: 2025-09-30</p>
                        <p>prescription Type: Contact Lenses/Spectacles</p>
                        <p>Left Eye SPH: -2.00  CYL:-1.00  Axe: 170 ADD +1.00</p>
                        <p>Right Eye SPH: -1.50 CYL:-1.25  Axe: 170 ADD +1.00</p>
                        <p>Notes: Patient prefers anti-glare coating.</p>
                    </div>
                    <button class="btn btn-primary btn-sm btn-enter-prescription">Enter Prescription</button>
                    <button class="btn btn-primary btn-sm btn-previouse-prescriptions">Previouse Prescriptions</button>
                    <button class="btn btn-primary btn-sm btn-print-prescritption">Print Prescription</button>
                </div>`
            );

            this.$customer_rx = this.$customer_section.find('.oerp-customer-rx');
            this.$customer_rx.find('.btn-enter-prescription').on('click', () => { this.open_optical_dialog() });
            this.$customer_rx.find('.btn-previouse-prescriptions').on('click', () => { this.open_previouse_prescriptions_dialog() });
            this.$customer_rx.find('.btn-print-prescritption').on('click', () => { this.open_prescritption_print_dialog() });
            // $customer_form.find('.btn-enter-prescription').on('click', alert('Enter Prescription clicked') );

        }

        open_optical_dialog() {
            console.log('Open Optical Dialog');
            let d = new frappe.ui.Dialog({
                title: 'Enter optical prescription',
                fields: [
                    { label: 'Left Eye SPH', fieldname: 'left_sph', fieldtype: 'Float' },
                    { label: 'Right Eye SPH', fieldname: 'right_sph', fieldtype: 'Float' },
                    { fieldtype: 'Column Break' },
                    { label: 'Notes', fieldname: 'notes', fieldtype: 'Small Text' },
                ],
                primary_action_label: __('Add to Invoice'),
                primary_action(values) {
                    // You can attach values to the invoice or custom table here
                    d.hide();
                }
            });
            d.show();
        }

        open_previouse_prescriptions_dialog() {
        console.log('Open Previouse Prescriptions Dialog');
        let d = new frappe.ui.Dialog({
            title: 'Previouse Prescriptions',
            fields: [
                {
                    label: 'Prescriptions',
                    fieldname: 'prescriptions',
                    fieldtype: 'Table',
                    fields: [
                        { label: 'Date', fieldname: 'date', fieldtype: 'Date', width: 100 },
                        { label: 'Left Eye SPH', fieldname: 'left_sph', fieldtype: 'Float', width: 100 },
                        { label: 'Right Eye SPH', fieldname: 'right_sph', fieldtype: 'Float', width: 100 },
                        { label: 'Notes', fieldname: 'notes', fieldtype: 'Data', width: 200 },
                    ],
                    data: [
                        { date: '2023-01-15', left_sph: -2.00, right_sph: -1.50, notes: 'Patient prefers anti-glare coating.' },
                        { date: '2022-12-10', left_sph: -1.75, right_sph: -1.25, notes: '' },
                    ],
                    get_data() {
                        return this.data;
                    }
                }
            ],
            primary_action_label: __('Close'),
            primary_action() {
                d.hide();
            }
        });
        d.show();
    }

    open_prescritption_print_dialog() {
        console.log('Open Prescription Print Dialog');
        let d = new frappe.ui.Dialog({
            title: 'Print Prescription',
            fields: [
                { label: 'Select Prescription', fieldname: 'prescription', fieldtype: 'Link', options: 'Prescription' },
            ],
            primary_action_label: __('Print'),
            primary_action(values) {
                // Implement print logic here
                d.hide();
            }
        });
        d.show();
    }
    }
});