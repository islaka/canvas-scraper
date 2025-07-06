@echo off

echo Starting Canvas Scraper batch process...
echo Reading URLs from canvas_course_links.txt

if not exist "canvas_course_links.txt" (
    echo Error: canvas_course_links.txt not found!
    pause
    exit /b 1
)

if not exist "canvas-scraper-win.exe" (
    echo Error: canvas-scraper-win.exe not found!
    pause
    exit /b 1
)

for /F "usebackq tokens=*" %%i in ("canvas_course_links.txt") do (
    echo Processing: %%i
    echo.
    canvas-scraper-win.exe "%%i"
    if errorlevel 1 (
        echo Error processing: %%i
        echo Continuing with next URL...
    ) else (
        echo Successfully processed: %%i
    )
    echo.
    echo ------------------------
    echo.
)

echo All URLs have been processed.
pause