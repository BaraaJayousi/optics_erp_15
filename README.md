### Optics ERP

an erp application to manage optical stores with refraction, spectacles and dispensing

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/BaraaJayousi/optics_erp_15 --branch main
bench install-app optics_erp
```

### Docker image

This repository includes a Docker build manifest for ERPNext 15 in `docker/apps.json`.
The image is intended to be built with the official `frappe_docker` custom image flow:

```powershell
.\docker\build.ps1 -Image bgd4000/optics_erp -Tag erpnext-v15
docker push bgd4000/optics_erp:erpnext-v15
docker push bgd4000/optics_erp:latest
```

The build tracks the latest ERPNext 15 line by using the upstream `version-15` branches
for Frappe and ERPNext, and includes this app from the `main` branch.

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/optics_erp
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

apache-2.0
