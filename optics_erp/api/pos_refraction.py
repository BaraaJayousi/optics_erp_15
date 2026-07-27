import frappe
from frappe import _


def _require_authenticated():
    if frappe.session.user == "Guest":
        frappe.throw(
            _("Authentication is required."),
            frappe.PermissionError,
        )


def _throw_patient_access_denied():
    frappe.throw(
        _("You are not permitted to view this patient's prescription."),
        frappe.PermissionError,
    )

@frappe.whitelist()
def get_latest_refraction(customer: str):
    _require_authenticated()
    """Return latest Refraction doc for a given Customer (by posting_date or modified)."""

    if not isinstance(customer, str) or not customer.strip() or len(customer) > 140:
        frappe.throw(_("Invalid patient."), frappe.ValidationError)

    customer = customer.strip()

    try:
        customer_doc = frappe.get_doc("Customer", customer)
    except frappe.DoesNotExistError:
        # Do not reveal whether an inaccessible patient exists.
        _throw_patient_access_denied()

    customer_doc.check_permission("read")

    if not frappe.has_permission("Refraction", "read"):
        _throw_patient_access_denied()

    rows = frappe.get_list(
        "Refraction",
        filters={"customer": customer},
        fields=["name"],
        order_by="refraction_date desc, creation desc",
        page_length=1,
    )

    if not rows:
        return {}

    refraction = frappe.get_doc("Refraction", rows[0].name)
    refraction.check_permission("read")

    return _serialize_pos_refraction(refraction)

def _serialize_pos_refraction(doc):
    return {
        "name": doc.name,
        "last_updated": doc.modified,
        "refractor": doc.refractor,
        "refraction_date": doc.refraction_date,
        "expiry_date": doc.expiry_date,
        "type": doc.prescription_type,
        "right": {
            "sph": doc.right_sph,
            "cyl": doc.right_cyl,
            "axis": doc.right_axis,
            "add": doc.right_add,
            "va_sc": doc.right_va_sc_decimal,
            "va_cc": doc.right_va_cc_decimal,
        },
        "left": {
            "sph": doc.left_sph,
            "cyl": doc.left_cyl,
            "axis": doc.left_axis,
            "add": doc.left_add,
            "va_sc": doc.left_va_sc_decimal,
            "va_cc": doc.left_va_cc_decimal,
        },
        "notes": doc.get("notes"),
    }
    