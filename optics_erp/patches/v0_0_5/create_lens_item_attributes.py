# optics_erp/patches/v0_0_6/create_lens_item_attributes.py
import frappe

def upsert_numeric_attribute(attribute_name: str, from_range: float, to_range: float, increment: float):
    """
    Create or update an Item Attribute configured for numeric ranges.
    """
    # Look up by attribute_name (the Item Attribute's primary identifier)
    name = frappe.db.get_value("Item Attribute", {"attribute_name": attribute_name}, "name")

    if name:
        doc = frappe.get_doc("Item Attribute", name)
    else:
        doc = frappe.get_doc({"doctype": "Item Attribute", "attribute_name": attribute_name})

    # Configure numeric behavior
    doc.numeric_values = 1
    doc.from_range = float(from_range)
    doc.to_range = float(to_range)
    doc.increment = float(increment)

    # Clear any discrete child rows if previously non-numeric
    if getattr(doc, "item_attribute_values", None):
        doc.set("item_attribute_values", [])

    doc.save(ignore_permissions=True)

def upsert_discrete_attribute(attribute_name: str, values_with_abbrs: list[tuple[str, str | None]]):
    """
    Create or update an Item Attribute with explicit discrete values.
    values_with_abbrs: list of tuples (value, abbr_or_None)
    """
    name = frappe.db.get_value("Item Attribute", {"attribute_name": attribute_name}, "name")

    if name:
        doc = frappe.get_doc("Item Attribute", name)
    else:
        doc = frappe.get_doc({"doctype": "Item Attribute", "attribute_name": attribute_name})

    # Ensure it's non-numeric
    doc.numeric_values = 0
    # Reset the child table so the patch is authoritative (clean & predictable)
    doc.set("item_attribute_values", [])

    seen = set()
    for value, abbr in values_with_abbrs:
        v = (value or "").strip()
        if not v or v.lower() in seen:
            continue
        seen.add(v.lower())
        doc.append("item_attribute_values", {
            "attribute_value": v,
            # Make a reasonable default abbr if not provided
            "abbr": (abbr or v).replace(" ", "").replace(".", "").upper()[:12],
        })

    doc.save(ignore_permissions=True)

def execute():
    # 1) Sphere Power: –12.00 → +12.00, step 0.25
    upsert_numeric_attribute("Sphere Power", -14.00, 14.00, 0.25)

    # 2) Cylinder Power: –6.00 → 0.00, step 0.25
    upsert_numeric_attribute("Cylinder Power", -6.00, 0.00, 0.25)

    # 3) Refractive Index (discrete common indices)
    upsert_discrete_attribute(
        "Refractive Index",
        [
            ("1.56", "1.56"),
            ("1.61", "1.61"),
            ("1.67", "1.67"),
        ],
    )