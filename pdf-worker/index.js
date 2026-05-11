const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 7000;

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport for better rendering of certificates
    await page.setViewport({ width: 1122, height: 794 }); // A4 Landscape roughly
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).send('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`PDF Worker listening at http://localhost:${port}`);
});
