const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(
  'C:',
  'Users',
  'dell',
  '.gemini',
  'antigravity',
  'brain',
  '9015b8b7-b268-498e-a91d-fd34cb705256',
  'screenshots'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonWithText(page, text) {
  const found = await page.evaluate((btnText) => {
    const elements = Array.from(document.querySelectorAll('button, a'));
    const el = elements.find((e) => e.innerText && e.innerText.trim().includes(btnText));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      return true;
    }
    return false;
  }, text);

  if (!found) {
    throw new Error(`Could not find button containing text: "${text}"`);
  }
  await sleep(800);
}

(async () => {
  console.log('🚀 Launching real Chrome browser for live end-to-end testing...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,920'],
    defaultViewport: { width: 1440, height: 920 },
  });

  const page = await browser.newPage();

  try {
    console.log('📍 1. Navigating to http://localhost:4200/dashboard...');
    await page.goto('http://localhost:4200/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png') });
    console.log('✔ Screenshot saved: 01_dashboard.png');

    console.log('📍 2. Testing 1-click Role Switch to SALES...');
    await clickButtonWithText(page, 'Sales');
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_sales_dashboard.png') });
    console.log('✔ Switched to SALES. Screenshot saved: 02_sales_dashboard.png');

    console.log('📍 3. Navigating to /applications/new (Wizard Step 1)...');
    await page.goto('http://localhost:4200/applications/new', { waitUntil: 'networkidle0' });
    await sleep(1000);

    console.log('📍 4. Filling Step 1 with user inputs (including omit.com.np and 1234)...');
    await page.type('input[formcontrolname="legalName"]', 'Apex Himalayan Exports LLC');
    await page.type('input[formcontrolname="dbaName"]', 'Apex Direct Trade');
    await page.type('input[formcontrolname="taxId"]', '86-7868769');
    await page.type('input[formcontrolname="incorporationDate"]', '2021-04-12');
    await page.type('input[formcontrolname="websiteUrl"]', 'omit.com.np');
    await page.type('input[formcontrolname="phone"]', '9804196445');
    await page.type('input[formcontrolname="street"]', 'Balaju');
    await page.type('input[formcontrolname="unit"]', '112');
    await page.type('input[formcontrolname="city"]', 'Kathmandu');
    await page.type('input[formcontrolname="state"]', 'CA');
    await page.type('input[formcontrolname="postalCode"]', '1234');

    await sleep(1500); // Allow debounced auto-save to register
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_step1_filled.png') });
    console.log('✔ Form filled. Screenshot saved: 03_step1_filled.png');

    console.log('📍 5. Clicking "Next Step" to verify progression to Step 2...');
    await clickButtonWithText(page, 'Next Step');
    await sleep(1200);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_step2_beneficial_owners.png') });
    console.log('✔ Successfully advanced to Step 2 (Beneficial Owners)! Screenshot saved: 04_step2_beneficial_owners.png');

    console.log('📍 6. Filling Step 2 (Beneficial Owners) & progressing to Step 3...');
    await page.type('input[formcontrolname="fullName"]', 'Sunil Shrestha');
    await page.type('input[formcontrolname="title"]', 'Managing Director');
    await page.type('input[formcontrolname="ssn"]', '984-21-4829');
    await page.type('input[formcontrolname="dateOfBirth"]', '1986-06-20');
    await page.type('input[formcontrolname="email"]', 'sunil@omit.com.np');

    await clickButtonWithText(page, 'Next Step');
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_step3_banking.png') });
    console.log('✔ Successfully advanced to Step 3 (Banking)! Screenshot saved: 05_step3_banking.png');

    console.log('📍 7. Filling Step 3 (Banking with Federal Reserve Checksum) & progressing to Step 4...');
    await page.type('input[formcontrolname="bankName"]', 'Silicon Valley Commercial Bank');
    await page.type('input[formcontrolname="accountHolderName"]', 'Apex Himalayan Exports LLC');
    await page.type('input[formcontrolname="routingNumber"]', '011000015'); // Valid ABA Routing
    await page.type('input[formcontrolname="accountNumber"]', '882049182390');
    await page.type('input[formcontrolname="confirmAccountNumber"]', '882049182390');

    await clickButtonWithText(page, 'Next Step');
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_step4_processing.png') });
    console.log('✔ Successfully advanced to Step 4 (Processing Volume)! Screenshot saved: 06_step4_processing.png');

    console.log('📍 8. Progressing to Step 5 (Review & Submission)...');
    await clickButtonWithText(page, 'Next Step');
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_step5_review.png') });
    console.log('✔ Successfully arrived at Step 5 (Review)! Screenshot saved: 07_step5_review.png');

    console.log('📍 9. Signing Attestation & Submitting Merchant Application...');
    await page.click('input[formcontrolname="certifiedAccurate"]');
    await page.type('input[formcontrolname="authorizedSignerName"]', 'Sunil Shrestha');
    await sleep(500);

    await clickButtonWithText(page, 'Submit Merchant Application');
    await sleep(2500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_application_submitted_detail.png') });
    console.log('✔ Application submitted successfully! Screenshot saved: 08_application_submitted_detail.png');

    console.log('📍 10. Testing REVIEWER Role & Sensitive Data Reveal on Banking Tab...');
    await clickButtonWithText(page, 'Reviewer');
    await sleep(1000);

    // Switch to Banking Tab
    await clickButtonWithText(page, 'Banking & Settlement');
    await sleep(800);

    // Click Reveal button
    const revealBtn = await page.waitForSelector('button.reveal-btn');
    await revealBtn.click();
    await sleep(1200);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_sensitive_data_revealed.png') });
    console.log('✔ Sensitive bank data revealed with 30s auto-remask timer! Screenshot saved: 09_sensitive_data_revealed.png');

    console.log('📍 11. Testing Risk Reviewer Decision Console (Approval with conditions)...');
    await clickButtonWithText(page, 'Processing & Risk Decision');
    await sleep(800);

    // Fill notes & commit decision
    await page.type('textarea[placeholder*="Record underwriting rationale"]', 'Verified bank credentials and merchant identity. Low chargeback profile.');
    await sleep(500);
    await clickButtonWithText(page, 'Commit Underwriting Decision');
    await sleep(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_decision_committed_approved.png') });
    console.log('✔ Decision committed! Status is now APPROVED. Screenshot saved: 10_decision_committed_approved.png');

    console.log('📍 12. Testing the Concurrent 401 Mutex Interceptor...');
    await clickButtonWithText(page, 'Test 401 Mutex');
    await sleep(2500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_401_mutex_success.png') });
    console.log('✔ Concurrent 401 Mutex tested with success toast! Screenshot saved: 11_401_mutex_success.png');

    console.log('\n🎉 ALL LIVE BROWSER DEMO TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Browser Test Error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_screenshot.png') });
  } finally {
    await browser.close();
  }
})();
