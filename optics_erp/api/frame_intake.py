import frappe
from frappe.utils import flt, now_datetime

@frappe.whitelist()
def add_quantity_for_intake(intake: str, qty: float, warehouse: str | None = None):
    """Increase stock for the Item linked to a Frame Intake by creating a Material Receipt."""
    fi = frappe.get_doc('Frame Intake', intake)
    if fi.docstatus != 1:
        frappe.throw('Frame Intake must be submitted')
    if not fi.created_item:
        frappe.throw('Frame Intake has no linked Item (created_item)')

    qty = flt(qty)
    if qty <= 0:
        frappe.throw('Quantity must be greater than zero')

    item_code = fi.created_item
    t_wh = warehouse or fi.get('target_warehouse') or fi.get('warehouse') \
            or frappe.db.get_single_value('Stock Settings', 'default_warehouse')

    se = frappe.new_doc('Stock Entry')
    se.stock_entry_type = 'Material Receipt'
    se.append('items', {
        'item_code': item_code,
        'qty': qty,
        't_warehouse': t_wh,
        'conversion_factor': 1,
        'uom': 'Nos',
    })
    se.insert(ignore_permissions=True)
    se.submit()

    # optional: touch/update an "updated_at" on intake for UX
    fi.db_set('modified', now_datetime())

    return {'stock_entry': se.name, 'item_code': item_code, 'qty_added': qty, 'warehouse': t_wh}
