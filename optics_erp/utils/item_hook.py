from __future__ import annotations
from optics_erp.utils.lens_price_sync import sync_from_template, apply_variant_override_now

def on_item_update(doc, _):
    """
    - If TEMPLATE: propagate unified_price to variants (override-aware).
    - If VARIANT: apply its own override/do_not_sync immediately.
    """
    if getattr(doc, "has_variants", 0):
        # TEMPLATE
        sync_from_template(doc.name, getattr(doc, "custom_unified_price", None))
        return

    if getattr(doc, "variant_of", None):
        # VARIANT
        apply_variant_override_now(doc.name)