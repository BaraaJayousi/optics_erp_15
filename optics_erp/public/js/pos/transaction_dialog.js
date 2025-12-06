frappe.provide("optics_erp.pos");

optics_erp.pos.render_invoice_dialog = function (doc) {
    const toNumber = (v) => parseFloat(v || 0) || 0;

    const grand_total = toNumber(doc.rounded_total || doc.grand_total);
    const paid_amount = toNumber(doc.paid_amount);
    const outstanding = grand_total - paid_amount;
    // build a simple HTML table of line items and remarks
    let html = `<p><strong>${__("Customer")}:</strong> ${frappe.utils.escape_html(doc.customer)}</p>`;
    html += `<p><strong>${__("Invoice ID")}:</strong> ${frappe.utils.escape_html(doc.name)}</p>`;
    html += `<p><strong>${__("Posting Date")}:</strong> ${frappe.datetime.str_to_user(doc.posting_date)}</p>`;
    html += `<p><strong>${__("Notes")}:</strong> ${frappe.utils.escape_html(doc.remarks || "")}</p>`;
    html += `<table class="table table-bordered table-striped">
        <thead>
            <tr>
                <th>${__("Image")}</th>
                <th>${__("Item")}</th>
                <th>${__("Qty")}</th>
                <th>${__("Rate")}</th>
                <th>${__("Amount")}</th>
            </tr>
        </thead>
        <tbody>`;
    (doc.items || []).forEach(item => {
        const img_src = item.image
            ? frappe.urllib.get_full_url(item.image)   // makes absolute URL
            : null;

        const img_html = img_src
            ? `<img src="${img_src}" style="height:120px; max-width:120px;">`
            : '';
        html += `<tr>
            <td>${img_html}</td>
            <td>${frappe.utils.escape_html(item.item_name)}</td>
            <td>${item.qty}</td>
            <td>${frappe.format(item.rate, { fieldtype: "Currency" })}</td>
            <td>${frappe.format(item.amount, { fieldtype: "Currency" })}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    return { html, outstanding };
};

optics_erp.pos.show_transaction_dialog = function (invoice_name) {
    // fetch the Sales Invoice (you can switch to POS Invoice if you prefer)
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'POS Invoice',
            'filters': { 'name': invoice_name },

        },
        callback: function (r) {
            const doc = r.message;
            // console.log(doc.items);
            const d = new frappe.ui.Dialog({
                title: __('Invoice Details'),
                fields: [{ fieldtype: 'HTML', fieldname: 'content' }],
                primary_action_label: __('Close'),
                primary_action() { d.hide(); }
            });
            const { html, outstanding } = optics_erp.pos.render_invoice_dialog(doc);
            const $wrapper = d.get_field('content').$wrapper;
            $wrapper.html(html);

            // Wire up the "Add Payment" button if there is outstanding amount
            if (outstanding > 0.0001) {
                $wrapper.find('.oerp-add-payment').on('click', function () {
                    optics_erp.pos.open_add_payment_dialog(doc, outstanding, d);
                });
            }
            d.show();
        }
    });
};
