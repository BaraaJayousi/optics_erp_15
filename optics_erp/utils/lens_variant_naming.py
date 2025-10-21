import frappe

def custom_variant_name(doc, method=None):
    print("#############Generating custom variant name...")
    frappe.log_error("custom_variant_name fired", "optics_erp")
    """Generate a deterministic name for a variant based on its template + attributes."""
    if not getattr(doc, "variant_of", None):
        return  # only variants

    template = doc.variant_of

    # Fetch its attribute values
    attrs = {d.attribute: d.attribute_value for d in doc.get("attributes", [])}

    # Build your code, e.g.:
    sph = attrs.get("Sphere Power", "")
    cyl = attrs.get("Cylinder Power", "")
    ri  = attrs.get("Refractive Index", "")

    code = f"{template} S{sph or 0} C{cyl or 0}-RI{ri}"
    doc.item_name = code.upper()
    doc.name = code.upper()