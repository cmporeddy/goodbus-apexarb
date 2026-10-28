const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACTS_DIR = '/Users/krishnareddy/.gemini/antigravity-ide/brain/569574e4-0da7-455d-b681-4540a22c1254';

(async () => {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Click Search Buses
  console.log('Clicking SEARCH BUSES...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const search = btns.find(b => b.textContent && b.textContent.includes('SEARCH BUSES'));
    if (search) search.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Dismiss Offers modal if present
  console.log('Closing modal if open...');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const modalClose = closeBtns.find(b => b.textContent.includes('close') || b.querySelector('span.material-symbols-outlined')?.textContent === 'close');
    if (modalClose) modalClose.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 3. Click View Seats or Select Seats
  console.log('Clicking Select Seats...');
  const seatBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const seatBtn = btns.find(b => b.textContent && (b.textContent.includes('Select Seats') || b.textContent.includes('View Seats')));
    if (seatBtn) {
      seatBtn.click();
      return true;
    }
    return false;
  });
  console.log('Seat button clicked:', seatBtnClicked);
  await new Promise(r => setTimeout(r, 2500));

  // 4. Click an available seat
  console.log('Clicking available seat...');
  const selectedTitle = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const avail = btns.find(b => b.title && b.title.startsWith('Seat ') && b.textContent && b.textContent.includes('₹') && !b.className.includes('bg-gray-100'));
    if (avail) {
      avail.click();
      return avail.title;
    }
    return null;
  });
  console.log('Selected seat:', selectedTitle);
  await new Promise(r => setTimeout(r, 1500));

  // 5. Click Continue to Booking
  console.log('Clicking Continue to Booking...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Continue to Booking'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 6. If Boarding/Dropping selection screen appears, click proceed to passenger details
  console.log('Checking for Boarding & Dropping or Passenger details...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && (b.textContent.includes('Proceed to Passenger') || b.textContent.includes('Passenger Details')));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 7. Screenshot Passenger Details
  console.log('Capturing 01_passenger_details.png...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_passenger_details.png') });

  // 8. Click Continue to Secure Payment (invokes blockTicketV2)
  console.log('Clicking "Continue to Secure Payment"...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Continue to Secure Payment'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // 9. Screenshot Payment Screen (Razorpay with PhonePe, Google Pay, CRED & 8-minute tentative lock)
  console.log('Capturing 02_payment_screen_razorpay.png...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_payment_screen_razorpay.png') });

  // 10. Click Pay via Razorpay
  console.log('Clicking "Pay via Razorpay"...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Pay') && b.textContent.includes('Razorpay'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 11. Screenshot Razorpay Modal
  console.log('Capturing 03_razorpay_modal.png...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_razorpay_modal.png') });

  console.log('Completed successfully!');
  await browser.close();
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
