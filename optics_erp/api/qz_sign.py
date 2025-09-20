import base64
import frappe
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

# Load your private key once (store it outside the repo if possible)
_KEY_PATH = "/home/frappe/qz-keys/qz-app.key"  # <-- change this

with open(_KEY_PATH, "rb") as f:
    _PRIVATE = load_pem_private_key(f.read(), password=None)

@frappe.whitelist(methods=["POST"])
def qz_sign(toSign: str):
    print('qz_sign called')
    """Return base64 signature for QZ Tray."""
    if not toSign:
        frappe.throw("Missing 'toSign'")
    data = base64.b64decode(toSign)
    sig = _PRIVATE.sign(data, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(sig).decode()