# Docker Build

This folder defines the custom ERPNext 15 image for `bgd4000/optics_erp`.

The image is built with Frappe Docker's custom image flow and installs:

- Frappe from `version-15`
- ERPNext from `version-15`
- Optics ERP from `BaraaJayousi/optics_erp_15`, branch `main`

## Build on Windows PowerShell

From the repository root:

```powershell
.\docker\build.ps1 -Image bgd4000/optics_erp -Tag erpnext-v15
```

Push after logging in to Docker Hub:

```powershell
docker login
docker push bgd4000/optics_erp:erpnext-v15
docker push bgd4000/optics_erp:latest
```

## Use in Frappe Docker

In your `.env` file for the running Docker setup:

```env
CUSTOM_IMAGE=bgd4000/optics_erp
CUSTOM_TAG=erpnext-v15
PULL_POLICY=always
```

Then recreate the containers using your existing compose command.

After the containers start, run migration and rebuild assets for your site:

```powershell
docker compose exec backend bench --site your-site-name migrate
docker compose exec backend bench --site your-site-name clear-cache
```

Use a backup or staging copy first if this is a production clinic database.
