const lines = [
  'Toss sandbox QA lane',
  '',
  '1. Install the latest Toss sandbox app and sign in with the workspace account.',
  '2. Launch `intoss://{appName}` and verify brand name, icon, and top-level routes.',
  '3. Confirm the home, saju, today, tarot, and iching screens all render without layout breaks.',
  '4. Confirm back/foreground recovery, same-tab reselection reset, and deep-link stability.',
  '5. Do not validate in-app ads in sandbox. Sandbox does not support Toss ads.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/development/test/sandbox.html',
  '- https://developers-apps-in-toss.toss.im/tutorials/react-native.html',
];

console.log(lines.join('\n'));
