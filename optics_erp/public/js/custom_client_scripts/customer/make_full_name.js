frappe.ui.form.on('Customer', {

    custom_first_name(frm) {
        full_name = update_full_name(frm.doc.custom_first_name, frm.doc.custom_middle_name, frm.doc.custom_last_name)
        frm.set_value('customer_name', full_name)
        // make customer_name read only
        frm.set_df_property('customer_name', 'read_only', 1);
    },

    custom_middle_name(frm) {
        full_name = update_full_name(frm.doc.custom_first_name, frm.doc.custom_middle_name, frm.doc.custom_last_name)
        frm.set_value('customer_name', full_name)
        // make customer_name read only
        frm.set_df_property('customer_name', 'read_only', 1);
    },

    custom_last_name(frm) {
        full_name = update_full_name(frm.doc.custom_first_name, frm.doc.custom_middle_name, frm.doc.custom_last_name)
        frm.set_value('customer_name', full_name)
        // make customer_name read only
        frm.set_df_property('customer_name', 'read_only', 1);
    },
})

const update_full_name = (first_name, middle_name, last_name) => {
    return normalizeArabic(`${first_name || ''} ${middle_name || ''} ${last_name || ''}`)
}

function normalizeArabic(str) {
    return str
        .replace(/[أإآ]/g, 'ا')   // hamza-on-alif → alif
        .replace(/ة/g, 'ه')       // ta marbuta → heh
        .replace(/ى/g, 'ي')       // alif maqsura → yeh
        .replace(/ؤ/g, 'و')       // waw with hamza → waw
        .replace(/ئ/g, 'ي')       // yeh with hamza → yeh
        .replace(/ٱ/g, 'ا')       // alif wasla → alif
        .replace(/[\u064B-\u0652]/g, '') // harakat (diacritics) → remove
        .replace(/\u0640/g, '')  // tatweel/kashida → remove
        .trim().replace(/\s+/g, ' '); // removes extra spaces
}