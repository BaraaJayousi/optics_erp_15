param(
    [string]$Image = "bgd4000/optics_erp",
    [string]$Tag = "erpnext-v15",
    [string]$FrappeDockerDir = "$PSScriptRoot\..\frappe_docker"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required to clone or update frappe_docker."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is required to build the image."
}

if (-not (Test-Path $FrappeDockerDir)) {
    git clone --depth 1 https://github.com/frappe/frappe_docker.git $FrappeDockerDir
} else {
    git -C $FrappeDockerDir pull --ff-only
}

$appsJsonPath = Resolve-Path "$PSScriptRoot\apps.json"
$appsJsonBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($appsJsonPath))
$containerFile = Join-Path $FrappeDockerDir "images\custom\Containerfile"

docker build `
    --build-arg "FRAPPE_PATH=https://github.com/frappe/frappe" `
    --build-arg "FRAPPE_BRANCH=version-15" `
    --build-arg "APPS_JSON_BASE64=$appsJsonBase64" `
    --tag "${Image}:${Tag}" `
    --tag "${Image}:latest" `
    --file $containerFile `
    $FrappeDockerDir

Write-Host "Built ${Image}:${Tag} and ${Image}:latest"
Write-Host "Push with: docker push ${Image}:${Tag}; docker push ${Image}:latest"
