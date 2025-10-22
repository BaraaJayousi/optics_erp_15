import frappe

def execute(filters=None):
    filters = frappe._dict(filters or {})
    data = get_data(filters)

    columns = [
        {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 380},
        {"label": "Sphere", "fieldname": "sphere", "fieldtype": "Data", "width": 80},
        {"label": "Cylinder", "fieldname": "cylinder", "fieldtype": "Data", "width": 80},
        {"label": "Qty", "fieldname": "actual_qty", "fieldtype": "Int", "width": 60},
        {"label": "Refractive Index", "fieldname": "refractive_index", "fieldtype": "Data", "width": 120},
    ]
    return columns, data


def get_data(filters):
    conditions = []
    params = {}

    if filters.get("warehouse"):
        conditions.append("b.warehouse = %(warehouse)s")
        params["warehouse"] = filters["warehouse"]
    if filters.get("template"):
        conditions.append("i.variant_of = %(template)s")
        params["template"] = filters["template"]
    if filters.get("lens_name"):
        conditions.append("i.item_name LIKE %(lens_name)s")
        params["lens_name"] = f"%{filters['lens_name']}%"
    # if filters.get("sphere"):
    #     conditions.append("AND i.sphere= %(sphere)s")
    #     params["sphere"] = f["sphere"]
    # if filters.get("cylinder"):
    #     conditions.append("c.attribute = 'Cylinder Power' AND c.attribute_value = %(cylinder)s")
    #     params["cylinder"] = f["cylinder"]
    # if filters.get("refractive_index"):
    #     conditions.append("ri.attribute = 'Refractive Index' AND ri.attribute_value = %(refractive_index)s")
    #     params["refractive_index"] = f["refractive_index"]
    # if filters.get("coating"):
    #     conditions.append("co.attribute = 'Coating' AND co.attribute_value = %(coating)s")
    #     params["coating"] = f["coating"]
    if filters.get("item_group"):
        conditions.append("i.item_group = %(item_group)s")
        params["item_group"] = filters["item_group"]

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    sql = f"""
    SELECT
        i.name AS item_code,
        i.item_name,
        (SELECT attribute_value FROM `tabItem Variant Attribute`
            WHERE parent = i.name AND attribute = 'Sphere Power' LIMIT 1) AS sphere,
        (SELECT attribute_value FROM `tabItem Variant Attribute`
            WHERE parent = i.name AND attribute = 'Cylinder Power' LIMIT 1) AS cylinder,
        (SELECT attribute_value FROM `tabItem Variant Attribute`
            WHERE parent = i.name AND attribute = 'Refractive Index' LIMIT 1) AS refractive_index,
        (SELECT attribute_value FROM `tabItem Variant Attribute`
            WHERE parent = i.name AND attribute = 'Coating' LIMIT 1) AS coating,
        b.warehouse,
        COALESCE(SUM(b.actual_qty), 0) AS actual_qty
    FROM `tabItem` AS i
    LEFT JOIN `tabBin` AS b ON b.item_code = i.name
    {where}
    GROUP BY i.name, i.item_name, b.warehouse
    ORDER BY i.name;
    """

    return frappe.db.sql(sql, params, as_dict=True)
