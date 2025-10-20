# Copyright (c) 2025, Baraa Jayousi and contributors
# For license information, please see license.txt

# import frappe

import frappe
from frappe.model.document import Document

class FrameIntake(Document):
	def on_submit(self):
		# 1) Create Item
		item = frappe.new_doc("Item")
		item.item_code = f'{self.brand:03}-{self.frame_code}-{self.color_code}'
		item.item_name = self.name
		item.item_group = "Eyeglass Frames"     # ensure this exists
		item.stock_uom = "Frame" 		  # ensure this UOM exists
		item.is_stock_item = 1
		item.include_item_in_pos = 1
		item.is_sales_item = 1
		item.is_purchase_item = 1
		item.brand = self.brand

		# optional custom fields on Item (create those as Custom Fields once)
		item.frame_material = getattr(self, "frame_material", None)
		item.frame_type = getattr(self, "frame_type", None)
		item.frame_category = getattr(self, "frame_category", None)
		item.frame_subcategory = getattr(self, "frame_subcategory", None)

		item.frame_size = getattr(self, "frame_size", None)
		item.bridge_size = getattr(self, "bridge_size", None)
		item.temple_size = getattr(self, "temple_size", None)

		if self.image:
			item.image = self.image

		code = f'{self.brand:03}{self.frame_code}{self.color_code}'
		item.append("barcodes", {"barcode": code})
		item.insert()
		frappe.db.set_value(self.doctype, self.name, "barcode", code)
		
		frappe.db.set_value(self.doctype, self.name, "created_item", item.name)
		# 2) Prices
		if self.selling_price:
			sp = frappe.new_doc("Item Price")
			sp.item_code = item.name
			sp.price_list = "Standard Selling"
			sp.price_list_rate = float(self.selling_price)
			sp.selling = 1
			sp.insert()

		if self.purchase_price:
			pp = frappe.new_doc("Item Price")
			pp.item_code = item.name
			pp.price_list = "Standard Buying"
			pp.price_list_rate = float(self.purchase_price)
			pp.buying = 1
			pp.insert()

		# 3) Opening Stock
		qty = float(self.quantity or 0)
		if qty > 0 and self.warehouse:
			se = frappe.new_doc("Stock Entry")
			se.purpose = "Material Receipt"
			se.stock_entry_type  = "Material Receipt"
			se.to_warehouse = self.warehouse
			se.append("items", {
				"item_code": item.name,
				"t_warehouse": self.warehouse,
				"qty": qty,
				"basic_rate": float(self.purchase_price or 0),
				"uom": item.stock_uom,
				"conversion_factor": 1.0
			})
			se.insert()
			se.submit()
			
		frappe.msgprint(
			f"Item <b>{item.name}</b> created with barcode <code>{code}</code>.",
			title="Frame Intake Complete"
		)


