@echo off
setlocal

if "%~1"=="" (
    echo Usage: update-version.bat ^<MAJOR.MINOR.PATCH^>
    echo Example: update-version.bat 1.1.0
    exit /b 1
)

set "NEW_VERSION=%~1"

:: Validate semantic version format.
node -e "const v=process.argv[1]; if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v)) { console.error('Invalid version. Expected MAJOR.MINOR.PATCH, for example 1.1.0'); process.exit(1); }" "%NEW_VERSION%"

if errorlevel 1 (
    exit /b 1
)

echo.
echo ===============================
echo Updating version to %NEW_VERSION%
echo ===============================
echo.

if not exist "manifest.json" (
    echo manifest.json not found in the current directory.
    exit /b 1
)

if not exist "package.json" (
    echo package.json not found in the current directory.
    exit /b 1
)

:: 1) Update VERSION file.
> "VERSION" echo %NEW_VERSION%

if errorlevel 1 (
    echo Failed to update VERSION.
    exit /b 1
)

echo VERSION updated.

:: 2) Update package.json and package-lock.json.
::
:: --no-git-tag-version prevents npm from creating its own commit and tag.
:: --allow-same-version allows the script to verify an already selected version.
:: --ignore-scripts prevents npm lifecycle scripts from running.
call npm version "%NEW_VERSION%" ^
    --no-git-tag-version ^
    --allow-same-version ^
    --ignore-scripts

if errorlevel 1 (
    echo Failed to update package.json.
    exit /b 1
)

echo package.json updated.

if exist "package-lock.json" (
    echo package-lock.json updated.
)

:: 3) Update the version field in manifest.json.
node -e "const fs=require('fs'); const file='manifest.json'; const data=JSON.parse(fs.readFileSync(file,'utf8')); data.version=process.argv[1]; fs.writeFileSync(file,JSON.stringify(data,null,2)+String.fromCharCode(10),'utf8');" "%NEW_VERSION%"

if errorlevel 1 (
    echo Failed to update manifest.json.
    exit /b 1
)

echo manifest.json updated.

:: 4) Verify updated versions.
node -e "const fs=require('fs'); const expected=process.argv[1]; const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8')); const packageJson=JSON.parse(fs.readFileSync('package.json','utf8')); if (manifest.version !== expected || packageJson.version !== expected) { console.error('Version verification failed.'); process.exit(1); }" "%NEW_VERSION%"

if errorlevel 1 (
    echo Version verification failed.
    exit /b 1
)

echo Version values verified.

:: 5) Commit changes when running inside a Git repository.
git rev-parse --is-inside-work-tree >nul 2>&1

if errorlevel 1 (
    echo.
    echo Not a Git repository, skipping commit.
    echo Version update complete.
    exit /b 0
)

git add VERSION manifest.json package.json

if exist "package-lock.json" (
    git add package-lock.json
)

git diff --cached --quiet

if errorlevel 2 (
    echo Failed to inspect staged changes.
    exit /b 1
)

if not errorlevel 1 (
    echo.
    echo No version changes to commit.
    exit /b 0
)

git commit -m "VERSION: %NEW_VERSION%"

if errorlevel 1 (
    echo Git commit failed.
    exit /b 1
)

echo.
echo Version committed.
echo.
echo =====================================
echo Version update complete.
echo.
echo Updated files:
echo - VERSION
echo - manifest.json
echo - package.json

if exist "package-lock.json" (
    echo - package-lock.json
)

echo.
echo Push the commit with:
echo git push
echo =====================================