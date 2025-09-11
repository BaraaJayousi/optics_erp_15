import frappe

@frappe.whitelist()
def get_latest_refraction(customer: str):
    """Return latest Refraction doc for a given Customer (by posting_date or modified)."""
    if not customer:
        return {}

    # find newest Refraction for this customer
    rows = frappe.db.get_list(
        "Refraction",
        filters={"customer": customer},
        fields=["name"],
        order_by="creation desc, modified desc",
        page_length=1,
    )
    if not rows:
        return {}

    doc = frappe.get_doc("Refraction", rows[0]["name"])

    # return only what you need on POS (keep payload small)
    return {
        "name": doc.name,
        "last_updated": doc.get("modified"),
        "refractor": doc.get("refractor"),
        "refraction_date": doc.get("refraction_date"),
        "expiry_date": doc.get("expiry_date"),
        "type": doc.get("prescription_type"),  # e.g. "Contact Lenses/Spectacles"
        "left": {
            "sph": doc.get("left_sph"),
            "cyl": doc.get("left_cyl"),
            "axis": doc.get("left_axis"),
            "add": doc.get("left_add"),
            "va_sc": doc.get("left_va_sc_decimal"),
            "va_cc": doc.get("left_va_cc_decimal"),
        },
        "right": {
            "sph": doc.get("right_sph"),
            "cyl": doc.get("right_cyl"),
            "axis": doc.get("right_axis"),
            "add": doc.get("right_add"),
            "va_sc": doc.get("right_va_sc_decimal"),
            "va_cc": doc.get("right_va_cc_decimal"),
        },
        "notes": doc.get("notes"),
    }