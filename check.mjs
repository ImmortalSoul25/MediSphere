import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  console.log("Navigating to dashboard...");
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  
  console.log("Navigating to calendar...");
  await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle2' });

  // wait a bit for any react errors to show up
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await browser.close();
})();
