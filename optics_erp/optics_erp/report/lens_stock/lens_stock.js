// Copyright (c) 2025, Baraa Jayousi and contributors
// For license information, please see license.txt

frappe.query_reports["Lens Stock"] = {
	"filters": [
		{
			"fieldname": "warehouse",
			"fieldtype": "Link",
			"label": "Warehouse",
			"mandatory": 1,
			"options": "Warehouse",
			"wildcard_filter": 0
		},
		{
			"fieldname": "item_group",
			"fieldtype": "Link",
			"label": "Item Group",
			"mandatory": 0,
			"options": "Item Group",
			"wildcard_filter": 0
		}, 
		{
			"fieldname": "lens_name",
			"fieldtype": "Data",
			"label": "Lens Name",
			"mandatory": 0,
			"wildcard_filter": 0
		},
		// {
		// 	"fieldname": "sphere",
		// 	"label": "Sphere Power",
		// 	"fieldtype": "Data"
		// },
		// {
		// 	"fieldname": "cylinder",
		// 	"label": "Cylinder Power",
		// 	"fieldtype": "Data"
		// },
		// {
		// 	"fieldname": "refractive_index",
		// 	"label": "Refractive Index",
		// 	"fieldtype": "Data"
		// },
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
			"default": 0
		}
	]
};
