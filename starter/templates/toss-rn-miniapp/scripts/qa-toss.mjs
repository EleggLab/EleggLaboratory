const lines = [
  'QR / Toss-app QA lane',
  '',
  '1. Build a fresh .ait bundle.',
  '2. Upload with console QR or `pnpm deploy:test`.',
  '3. Verify banner render, no-fill collapse, click-through, and return flow.',
  '4. Confirm audio pause/resume and background recovery on a real device.',
  '5. Ensure ads never interrupt critical flows such as login, signup, payment, or support.',
  '6. Treat analytics collection as live-only; dashboard verification happens on +1 day.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/ads/develop.html',
  '- https://developers-apps-in-toss.toss.im/ads/qa.html',
  '- https://developers-apps-in-toss.toss.im/development/test/toss.html',
];

console.log(lines.join('\n'));
