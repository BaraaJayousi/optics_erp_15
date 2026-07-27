import frappe
from frappe.utils import flt, now_datetime

def _require_authenticated():
    if frappe.session.user == "Guest":
        frappe.throw(
            _("Authentication is required."),
            frappe.PermissionError,
        )

@frappe.whitelist()
def add_quantity_for_intake(intake: str, qty: float, warehouse: str | None = None):
    """Increase stock for the Item linked to a Frame Intake by creating a Material Receipt."""
    _require_authenticated()

    if not isinstance(intake, str) or not intake.strip():
        frappe.throw(_("Invalid Frame Intake."), frappe.ValidationError)

    fi = frappe.get_doc("Frame Intake", intake.strip())
    fi.check_permission("read")
    fi.check_permission("submit")

    if fi.docstatus != 1:
        frappe.throw('Frame Intake must be submitted')
    if not fi.created_item:
        frappe.throw('Frame Intake has no linked Item (created_item)')

    item = frappe.get_doc("Item", fi.created_item)
    item.check_permission("read")

    if not item.is_stock_item or item.disabled:
        frappe.throw(_("The linked Item is not available for stock transactions."))

    qty = flt(qty)
    if qty <= 0:
        frappe.throw('Quantity must be greater than zero')

    target_warehouse = warehouse or fi.warehouse

    # Do not silently use the global default warehouse.
    if not target_warehouse:
        frappe.throw(_("A target warehouse is required."))

    warehouse_doc = frappe.get_doc("Warehouse", target_warehouse)
    warehouse_doc.check_permission("read")

    if warehouse_doc.is_group or warehouse_doc.get("disabled"):
        frappe.throw(_("Select an active, non-group warehouse."))

    if not frappe.has_permission("Stock Entry", "create"):
        frappe.throw(_("You cannot create stock entries."), frappe.PermissionError)

    if not frappe.has_permission("Stock Entry", "submit"):
        frappe.throw(_("You cannot submit stock entries."), frappe.PermissionError)

    stock_entry = frappe.new_doc("Stock Entry")
    stock_entry.company = warehouse_doc.company
    stock_entry.stock_entry_type = "Material Receipt"

    stock_entry.append("items", {
        "item_code": item.name,
        "qty": qty,
        "t_warehouse": warehouse_doc.name,
        "uom": item.stock_uom,
        "conversion_factor": 1,
    })

    stock_entry.check_permission("create")
    stock_entry.insert()

    stock_entry.check_permission("submit")
    stock_entry.submit()

    return {
        "stock_entry": stock_entry.name,
        "item_code": item.name,
        "qty_added": qty,
        "warehouse": warehouse_doc.name,
    }
