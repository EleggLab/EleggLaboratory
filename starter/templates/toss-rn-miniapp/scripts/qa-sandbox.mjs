const lines = [
  'Sandbox QA lane',
  '',
  '1. Install the latest Toss sandbox app.',
  '2. Log in with the Toss Business account used by the console workspace.',
  '3. Open intoss://{appName} and verify routing, brand, and TDS rendering.',
  '4. Confirm back/foreground recovery and scheme launch stability.',
  '5. Do not use sandbox for ad validation; sandbox does not support in-app ads.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/development/test/sandbox.html',
  '- https://developers-apps-in-toss.toss.im/tutorials/react-native.html',
];

console.log(lines.join('\n'));
