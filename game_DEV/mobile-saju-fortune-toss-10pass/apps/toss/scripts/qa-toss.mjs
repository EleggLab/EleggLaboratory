const lines = [
  'QR / Toss-app QA lane',
  '',
  '1. Build a fresh `.ait` bundle and upload it through the Toss console QR lane.',
  '2. Check the same-tab reset behavior on home, today, iching, saju, and tarot.',
  '3. Verify tarot result revisit, saju input save flow, and back-stack recovery on a real device.',
  '4. If banner ads are enabled later, verify render, no-fill collapse, click-through, and return flow.',
  '5. Confirm background recovery, network retry, and that no critical fortune flow is blocked.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/ads/develop.html',
  '- https://developers-apps-in-toss.toss.im/ads/qa.html',
  '- https://developers-apps-in-toss.toss.im/development/test/toss.html',
];

console.log(lines.join('\n'));
