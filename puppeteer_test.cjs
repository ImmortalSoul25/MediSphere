const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/patients/576190', { waitUntil: 'networkidle0' });
    console.log("Page loaded");
  } catch (e) {
    console.log("Failed to load page:", e.message);
  }

  await browser.close();
})();
