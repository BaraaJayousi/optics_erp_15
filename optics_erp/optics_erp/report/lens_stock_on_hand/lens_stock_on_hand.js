/* eslint-disable */
frappe.query_reports["Lens Stock on Hand"] = {
    "filters": [
        {
            "fieldname": "warehouse",
            "label": "Warehouse",
            "fieldtype": "Link",
            "options": "Warehouse"
        },
        {
            "fieldname": "item_group",
            "label": "Item Group",
            "fieldtype": "Link",
            "options": "Item Group"
        },
        {
            "fieldname": "template",
            "label": "Template (Variant Of)",
            "fieldtype": "Link",
            "options": "Item"
        },
        {
            "fieldname": "only_stock_lenses",
            "label": "Only Stock Lenses",
            "fieldtype": "Check",
            "default": 1
        }
    ]
};