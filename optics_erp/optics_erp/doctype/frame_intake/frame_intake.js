// Copyright (c) 2025, Baraa Jayousi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Frame Intake", {
    brand(frm) {
        const label = frm.fields_dict.brand.label;
        frm.set_value('brand_name', label);
    },
    refresh(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Increase Quantity'), () => openIncreaseQtyDialog(frm));
            frm.change_custom_button_type(__('Increase Quantity'), null, 'primary');
            frm.add_custom_button(__('Print Labels'), () => openPrintDialog(frm));
            frm.change_custom_button_type(__('Print Labels'), null, 'danger');
        }

        // Prompt to print barcode labels after creating the linked Item
        if (frm.doc.docstatus === 1 && frm.doc.created_item && !frm._asked_print) {
            frm._asked_print = true; // guard to avoid duplicate prompts
            // simple confirm dialog
            frappe.confirm(
                `Item <b>${frm.doc.created_item}</b> was created. Print the barcode label now?`,
                // Yes → open print view
                async () => {
                    const qtyRaw = (frm.doc.quantity ?? frm.doc.qty ?? 1);
                    const copies = Math.max(1, parseInt(qtyRaw, 10) || 1);
                    doPrintLabels(frm, copies, 'label printer', 'Frame Barcode Label');
                },
                // No → do nothing
                () => { }
            );
        }
    },
});

// ---------- Print Labels ----------
function openPrintDialog(frm) {
    if (!frm.doc.created_item) {
        return frappe.msgprint({ message: __('No linked Item found (created_item is empty). Submit the intake first.'), indicator: 'red' });
    }

    const d = new frappe.ui.Dialog({
        title: __('Print Barcode Labels'),
        fields: [
            { fieldname: 'copies', label: __('Number of Copies'), fieldtype: 'Int', reqd: 1, default: (frm.doc.quantity || 1), min: 1 },
            { fieldname: 'printer', label: __('Printer Name'), fieldtype: 'Data', reqd: 1, default: 'label printer' },
            { fieldname: 'format', label: __('Print Format'), fieldtype: 'Link', options: 'Print Format', default: 'Frame Barcode Label' },
        ],
        primary_action_label: __('Print'),
        async primary_action(v) {
            try {
                await doPrintLabels(frm, v.copies, v.printer, v.format);
                d.hide();
            } catch (e) {
                console.error(e);
                frappe.msgprint({ title: __('Print Failed'), message: __('Check QZ Tray and printer connection.'), indicator: 'red' });
            }
        },
    });

    d.show();
}
function openIncreaseQtyDialog(frm) {
    if (!frm.doc.created_item) {
        frappe.msgprint(__('No linked Item found (created_item is empty). Submit the intake first.'));
        return;
    }

    const d = new frappe.ui.Dialog({
        title: __('Increase Quantity'),
        fields: [
            { fieldname: 'qty', label: __('Quantity'), fieldtype: 'Float', reqd: 1, default: 1, min: 0.0001 },
            { fieldname: 'warehouse', label: __('Warehouse'), fieldtype: 'Link',
                options: 'Warehouse', default: frm.doc.target_warehouse || frm.doc.warehouse || '' },
            { fieldname: 'print_after', label: __('Print labels after adding?'), fieldtype: 'Check', default: 0 },
        ],
        primary_action_label: __('Add'),
        primary_action(values) {
            d.hide();
            frappe.call({
                method: 'optics_erp.api.frame_intake.add_quantity_for_intake',
                args: {
                    intake: frm.doc.name,
                    qty: values.qty,
                    warehouse: values.warehouse,
                },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.show_alert({
                            message: __('Added {0} pcs to stock entry {1}', [values.qty, r.message?.stock_entry || '']),
                            indicator: 'green'
                        });
                        // refresh doc to update timestamps or fields if needed
                        frm.reload_doc();
                        // if user checked "print_after", use the existing print helper
                        if (values.print_after) {
                            const copies = Math.max(1, parseInt(values.qty, 10) || 1);
                            doPrintLabels(frm, copies, 'label printer', 'Frame Barcode Label');
                        }
                    }
                }
            });
        }
    });
    d.show();
}

// Core print helper using QZ + trimmed printview HTML
async function doPrintLabels(frm, copies, printerName = 'label printer', formatName = 'Frame Barcode Label') {
    copies = Math.max(1, parseInt(copies, 10) || 1);

    await frappe.ui.form.qz_connect();
    const printer = await qz.printers.find(printerName);

    // fetch printview HTML then keep only the .print-format block
    const url = `/printview?doctype=Item&name=${encodeURIComponent(frm.doc.created_item)}`
        + `&format=${encodeURIComponent(formatName)}&no_letterhead=1&letterhead=0`;
    const preview = await (await fetch(url, { headers: { Accept: 'text/html' } })).text();

    const doc = new DOMParser().parseFromString(preview, 'text/html');
    const formatEl = doc.querySelector('.print-format');
    if (!formatEl) throw new Error('print-format not found in printview');

    const customStyle = formatEl.querySelector('style')?.outerHTML || '';
    const html = customStyle + formatEl.outerHTML;

    // QZ config and data (70mm x 18mm)
    const cfg = qz.configs.create(printer, { scaleContent: false, copies });
    const data = [{
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: html,
        options: { pageWidth: 2.76, pageHeight: 0.71 }, // inches
    }];

    try {
        await qz.print(cfg, data);         // preferred: one job with copies
    } catch (e) {
        // fallback for drivers that ignore "copies"
        for (let i = 0; i < copies; i++) {
            await qz.print(qz.configs.create(printer, { scaleContent: false }), data);
        }
    }
    frappe.ui.form.qz_success();
}