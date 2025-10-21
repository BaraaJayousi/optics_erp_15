import frappe

def execute(filters=None):
    filters = frappe._dict(filters or {})
    data = get_data(filters)
    columns = [
        {"label": "Item Code", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 200},
        {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 200},
        {"label": "Template", "fieldname": "variant_of", "fieldtype": "Link", "options": "Item", "width": 140},
        {"label": "Warehouse", "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 160},
        {"label": "Actual Qty", "fieldname": "actual_qty", "fieldtype": "Float", "precision": 2, "width": 110},
        {"label": "Projected Qty", "fieldname": "projected_qty", "fieldtype": "Float", "precision": 2, "width": 130},
        {"label": "Valuation Rate", "fieldname": "valuation_rate", "fieldtype": "Currency", "width": 130},
        {"label": "Stock Value", "fieldname": "stock_value", "fieldtype": "Currency", "width": 130},
    ]
    return columns, data

def get_data(f):
    conditions = []
    params = {}

    if f.get("warehouse"):
        conditions.append("b.warehouse = %(warehouse)s")
        params["warehouse"] = f["warehouse"]

    if f.get("item_group"):
        conditions.append("i.item_group = %(item_group)s")
        params["item_group"] = f["item_group"]

    if f.get("template"):
        conditions.append("i.variant_of = %(template)s")
        params["template"] = f["template"]

    if f.get("only_stock_lenses"):
        # narrow to your stock-lens template or group if you use one
        # pick the one you prefer and comment the other:
        # conditions.append("i.variant_of = 'STOCK LENS TEMPLATE CODE'")
        conditions.append("i.item_group = 'Stock Lenses'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    # Bin holds per-warehouse quantities; we left join to include 0-qty items.
    sql = f"""
    SELECT
        i.name AS item_code,
        i.item_name,
        i.variant_of,
        b.warehouse,
        COALESCE(SUM(b.actual_qty), 0) AS actual_qty,
        COALESCE(SUM(b.projected_qty), 0) AS projected_qty,
        COALESCE(AVG(NULLIF(b.valuation_rate, 0)), 0) AS valuation_rate,
        COALESCE(SUM(b.stock_value), 0) AS stock_value
    FROM `tabItem` i
    LEFT JOIN `tabBin` b ON b.item_code = i.name
    {where}
    GROUP BY i.name, i.item_name, i.variant_of, b.warehouse
    ORDER BY i.name, b.warehouse
    """
    return frappe.db.sql(sql, params, as_dict=True)