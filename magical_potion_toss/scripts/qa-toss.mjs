const lines = [
  'QR / Toss-app QA lane',
  '',
  '1. Build a fresh .ait bundle.',
  '2. Upload it in the Toss console and open the QR test path.',
  '3. Verify game login works and save data is restored after app restart.',
  '4. Confirm the built-in game X confirmation appears and does not overlap the order / cauldron UI.',
  '5. Test background pause/resume and interrupted-run recovery during order selection and brewing.',
  '6. Play through day 3 rent, day 6 rent, and the day 7 audit order to confirm end-to-end progression.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/checklist/app-game.html',
  '- https://developers-apps-in-toss.toss.im/game-login/intro.html',
  '- https://developers-apps-in-toss.toss.im/development/test/toss.html',
];

console.log(lines.join('\n'));
