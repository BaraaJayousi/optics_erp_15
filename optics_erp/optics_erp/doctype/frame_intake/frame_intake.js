// Copyright (c) 2025, Baraa Jayousi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Frame Intake", {
    brand(frm) {
        const label = frm.fields_dict.brand.label;
        frm.set_value('brand_name', label);
    },

    refresh(frm) {
        if (frm.doc.docstatus === 1 && frm.doc.created_item && !frm._asked_print) {
            frm._asked_print = true; // guard to avoid duplicate prompts
            // simple confirm dialog
            frappe.confirm(
                `Item <b>${frm.doc.created_item}</b> was created. Print the barcode label now?`,
                // Yes → open print view
                () => {
                    // pick your print format name (see section 3)
                    // const format = 'Frame Label QZ'; // change to your format name
                    // const url =
                    //     `/printview?doctype=Item` +
                    //     `&name=${encodeURIComponent(frm.doc.created_item)}` +
                    //     `&format=${encodeURIComponent(format)}` +
                    //     `&no_letterhead=1&letterhead=0`;
                    // window.open(url, '_blank');
                    // frappe.set_route('List', 'Barcode Label');
                    frappe.ui.form.qz_connect().then(() => {
                        return qz.printers.find("label printer");
                    }).then(async (printer) => {
                        const cfg = qz.configs.create(printer, {
                            units: 'mm',
                            size: { width: 72, height: 18 },
                            margins: 0,
                            jobName: `Print frame label ${frm.created_item}`,
                            scaleContent: false,
                            colorType: 'Default'
                        });

                        const data = [
                            {
                                type: 'raw',
                                format: 'html',
                                data: `
                                    <div style="text-align:center; font-family: Arial, sans-serif; font-size:12px;">
                                        <div>Item: ${frm.doc.created_item}</div>
                                        <div>Brand: ${frm.doc.brand_name || ''}</div>
                                        <div>Model: ${frm.doc.model || ''}</div>
                                        <div>Color: ${frm.doc.color || ''}</div>
                                        <div>Size: ${frm.doc.size || ''}</div>
                                        <div style="margin-top:5px;">
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(frm.doc.created_item)}" alt="QR Code" />
                                        </div>
                                    </div>
                                `
                            }
                        ];

                        await qz.print(cfg, data);
                    }).catch(err => {
                        frappe.msgprint(`Failed to print label: ${err}`);
                    });
                },
                // No → do nothing
                () => { }
            );
        }
    }
});
