const lines = [
  'QR / Toss-app QA lane',
  '',
  '1. Build a fresh .ait bundle.',
  '2. Upload it in the Toss console and open the QR test path.',
  '3. Verify game login works and save data is restored after app restart.',
  '4. Confirm the built-in game X confirmation appears and does not overlap battle UI.',
  '5. Test sound toggle, background pause/resume, and interrupted-run recovery.',
  '6. Play through victory and defeat to confirm rewards, mastery, and unlock progression.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/checklist/app-game.html',
  '- https://developers-apps-in-toss.toss.im/game-login/intro.html',
  '- https://developers-apps-in-toss.toss.im/development/test/toss.html',
];

console.log(lines.join('\n'));

