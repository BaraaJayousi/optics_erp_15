frappe.provide('frappe.ui.form');

// Replace the default class with a subclass that adds custom fields or behaviour
frappe.ui.form.CustomerQuickEntryForm = class CustomCustomerQuickEntryForm
    extends frappe.ui.form.ContactAddressQuickEntryForm {
    constructor(doctype, after_insert) {
        super(doctype, after_insert);
    }

    render_dialog() {
        // let the parent build the dialog first
        super.render_dialog();

        const dialog = this.dialog;
        dialog.get_field('customer_name').$input.prop('readonly', true);
        dialog.get_field('customer_type').$wrapper.attr('hidden', true);


        // Attach listeners to your custom fields
        ['custom_first_name', 'custom_middle_name', 'custom_last_name'].forEach(fname => {
            dialog.get_field(fname).$input.off('input._live').on('input._live', () => {
                dialog.set_value(
                    'customer_name',
                    update_full_name(
                        dialog.get_value('custom_first_name'),
                        dialog.get_value('custom_middle_name'),
                        dialog.get_value('custom_last_name')
                    )
                );
            });
        });
    }

    // Override insert() if you need to transform data before saving
    insert() {
        // custom code here
        return super.insert();
    }


    get_variant_fields() { 
        // add custom fields to the standard class fields
        var variant_fields = [
			{
				fieldtype: "Section Break",
				label: __("Contact Details"),
				collapsible: 0,
			},
			{
				label: __("Email Id"),
				fieldname: "email_address",
				fieldtype: "Data",
				options: "Email",
			},
			{
				fieldtype: "Column Break",
			},
			{
				label: __("Mobile Number"),
				fieldname: "mobile_number",
				fieldtype: "Data",
                reqd: 1,
			},
			{
				fieldtype: "Section Break",
				label: __("Primary Address Details"),
				collapsible: 1,
			},
			{
				fieldtype: "Column Break",
			},
			{
				label: __("City"),
				fieldname: "city",
				fieldtype: "Data",
                reqd: 1,
			},
            {
                label: __("Village"),
                fieldname: "village",
                fieldtype: "Data",
            },
			{
				label: __("Customer POS Id"),
				fieldname: "customer_pos_id",
				fieldtype: "Data",
				hidden: 1,
			},
		];

		return variant_fields;
    }
};

// TODO: move to a utility file if needed elsewhere

const update_full_name = (first_name, middle_name, last_name) => {
    return normalizeArabic(`${first_name || ''} ${middle_name || ''} ${last_name || ''}`)
}

function normalizeArabic(str) {
    return str
        .replace(/[أإآ]/g, 'ا')   // hamza-on-alif → alif
        .replace(/ة/g, 'ه')       // ta marbuta → heh
        // .replace(/ى/g, 'ي')       // alif maqsura → yeh
        .replace(/ؤ/g, 'و')       // waw with hamza → waw
        .replace(/ئ/g, 'ي')       // yeh with hamza → yeh
        .replace(/ٱ/g, 'ا')       // alif wasla → alif
        .replace(/[\u064B-\u0652]/g, '') // harakat (diacritics) → remove
        .replace(/\u0640/g, '')  // tatweel/kashida → remove
        .trim().replace(/\s+/g, ' '); // removes extra spaces
}