const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"], input[type="text"]', 'superadmin@cyberapex.io');
  await page.fill('input[type="password"]', 'Admin@1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3000/admin/students/7c51d260-dbeb-4585-8f11-f5101ff3dbb6');
  await page.waitForTimeout(2000);
  await page.click('button[title="Remove Course"]');
  await page.waitForTimeout(500);
  
  const isVisible = await page.isVisible('text="Remove Course?"');
  console.log('Is Modal Visible?', isVisible);
  
  if (isVisible) {
      // Find the second Remove Course button (the one inside the modal)
      const removeBtns = await page.$$('button:has-text("Remove Course")');
      await removeBtns[removeBtns.length - 1].click();
      console.log('Clicked Remove Course inside modal');
  }
  
  await page.waitForTimeout(1000);
  await browser.close();
})();
