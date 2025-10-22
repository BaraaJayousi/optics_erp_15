import frappe

def execute():
    def ensure_eyeframe_basics(group_name="Eyeglass Frames", uom_name="Frame", parent_group="All Item Groups"):
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