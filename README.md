# Canvas Scraper

Based on xxmistacruzxx's [canvas-scraper-cli](https://github.com/xxmistacruzxx/canvas-scraper-cli) with scripts to make scraping all courses easier.
Currently the code are using 2 different scripts but can be improved by merging all steps into 1 single script.

## Step by step guide

The main folder mentioned in this instruction is the folder with all the codes ("canvas-scraper")

### Step 0: Install requirements (if you don't have nodejs)

1. Install nodejs here: [NodeJS Download](https://nodejs.org/en/download)

### Step 1: Get the cookies.json

1. Install extention "CookieManager" on Chrome [CookieManager](https://chromewebstore.google.com/detail/cookiemanager-cookie-edit/hdhngoamekjhmnpenphenpaiindoinpo?hl=en&pli=1)
2. Open the Canvas website
3. Open the CookieManager extention
4. Click "Select All"
5. Click "Export"
6. Rename the file to "cookies.json"
7. Copy the file into the main folder

### Step 2. Get all courses URIs

1. Open the Canvas link with all courses [https://"your school Canvas link"/courses](https://your-school-Canvas-link/courses)
2. Press F12 to open DevTool
3. Choose "Console" tab on Devtool
4. Paste the code in console-script.txt to the input section of the console
NOTE: On Firefox, you have to type in "allow pasting" before pasting the code (make sure to delete the "allow pasting" text before pasting again)
5. Press "Enter"
6. Copy the downloaded canvas_course_links.txt back to the main folder

### Step 3. Run the download script

1. Open your terminal (Terminal app, cmd, Powershell, etc.):
   1. Download chrome for puppeteer by running the code "npx puppeteer browsers install chrome" (if not exist)
   2. Hold Shift + Right Click on the main folder
   3. Choose "Open Powershell Here"/"Open Command Prompt Here"
   4. Or you can open cmd/powershell/terminal and "cd "main folder path here""
2. Run the script by typing ".\download-all.bat"
