import frappe

def execute():
    def ensure_eyeframe_basics(group_name="Eyeglass Frames", uom_name="Frame", parent_group="All Item Groups"):
        """
        This patch updates the Brand DocType so that:
        1. Documents are auto-named using the database's autoincrement (autoincrement naming method).
        2. The title field for the Brand DocType is set to the 'brand' field.
        """

        # shows the Brand name rather than the numeric ID
        frappe.db.set_value("DocType", "Brand", "title_field", "brand")

        # Clear cache so the new naming settings take effect immediately
        frappe.clear_cache(doctype="Brand")

        # Clear cache so the new settings take effect immediately
        frappe.clear_cache(doctype="Brand")
        # UOM
        if not frappe.db.exists("UOM", uom_name):
            frappe.get_doc({
                "doctype": "UOM",
                "uom_name": uom_name,
                "enabled": 1,
                "must_be_whole_number": 1
            }).insert()

        # parent group check
        if not frappe.db.exists("Item Group", parent_group):
            raise Exception(f"Parent Item Group '{parent_group}' not found.")

        # Item Group
        if not frappe.db.exists("Item Group", group_name):
            frappe.get_doc({
                "doctype": "Item Group",
                "item_group_name": group_name,
                "parent_item_group": parent_group,
                "is_group": 0
            }).insert()

    def ensure_stock_lense_uom():
        uom_name = "Lens"
        parent_group = "All Item Groups"
        group_name = "Stock Lenses"
        if not frappe.db.exists("UOM", uom_name):
            frappe.get_doc({
                "doctype": "UOM",
                "uom_name": uom_name,
                "enabled": 1,
                "must_be_whole_number": 0
            }).insert()

        # parent group check
        if not frappe.db.exists("Item Group", parent_group):
            raise Exception(f"Parent Item Group '{parent_group}' not found.")

        if not frappe.db.exists("Item Group", group_name):
            frappe.get_doc({
                "doctype": "Item Group",
                "item_group_name": group_name,
                "parent_item_group": parent_group,
                "is_group": 0
            }).insert()

    ensure_eyeframe_basics()
    ensure_stock_lense_uom()