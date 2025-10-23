import frappe

def _default_price_lists():
    selling = frappe.db.get_single_value("Selling Settings", "selling_price_list") or "Standard Selling"
    buying  = frappe.db.get_single_value("Buying Settings", "buying_price_list")   or "Standard Buying"
    return selling, buying

def _get_variants(template_item_code: str) -> list[str]:
    return frappe.get_all("Item", filters={"variant_of": template_item_code}, pluck="name")

def _upsert_item_price(item_code: str, price_list: str, rate: float):
    name = frappe.db.get_value("Item Price", {"item_code": item_code, "price_list": price_list}, "name")
    if name:
        doc = frappe.get_doc("Item Price", name)
        if float(doc.price_list_rate or 0) != float(rate):
            doc.price_list_rate = rate
            doc.save(ignore_permissions=True)
    else:
        frappe.get_doc({
            "doctype": "Item Price",
            "item_code": item_code,
            "price_list": price_list,
            "price_list_rate": rate,
        }).insert(ignore_permissions=True)

def sync_from_template(template_item_code: str, unified_rate: float | None):
    """Propagate template unified price to its variants, respecting variant overrides."""
    if unified_rate is None:
        return

    selling_pl, buying_pl = _default_price_lists()

    # keep template with item prices too (handy for reference)
    # for pl in (selling_pl, buying_pl):
    #     _upsert_item_price(template_item_code, pl, float(unified_rate))

    # variants
    for variant in _get_variants(template_item_code):
        vdoc = frappe.get_doc("Item", variant)
        # choose variant override if provided, else unified
        rate = getattr(vdoc, "custom_override_price", None)
        print(rate)
        rate = float(rate) if rate not in (None, "") and int(getattr(vdoc, "custom_dont_sync_price", 0)) == 1 else float(unified_rate)

        _upsert_item_price(variant, selling_pl, rate)
        _upsert_item_price(variant, buying_pl, rate)
        # skip if explicitly opted-out
        if int(getattr(vdoc, "custom_dont_sync_price", 0)) == 1:
            continue

def apply_variant_override_now(variant_item_code: str):
    """Immediately apply a variant's own override/do_not_sync to its two price lists."""
    vdoc = frappe.get_doc("Item", variant_item_code)
    if not vdoc.variant_of:
        return  # not a variant

    selling_pl, buying_pl = _default_price_lists()

    # Take override if present, else fall back to template unified
    if vdoc.custom_override_price not in (None, "") and int(getattr(vdoc, "custom_dont_sync_price", 0)) == 1:
        rate = float(vdoc.custom_override_price)
    else:
        t_unified = frappe.db.get_value("Item", vdoc.variant_of, "custom_unified_price")
        if t_unified in (None, ""):
            return  # nothing to write
        rate = float(t_unified)

    _upsert_item_price(vdoc.name, selling_pl, rate)
    _upsert_item_price(vdoc.name, buying_pl, rate)