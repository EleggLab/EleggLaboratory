const lines = [
  'Sandbox QA lane',
  '',
  '1. Install the latest Toss sandbox app.',
  '2. Open intoss://{appName} and verify game navigation shell loads without overlap.',
  '3. Confirm the lobby opens inside 10 seconds and uses the game WebView chrome.',
  '4. Start a run, background the app, and verify the game resumes without corrupted state.',
  '5. Verify game-login fallback messaging in local and sandbox environments.',
  '',
  'Reference docs:',
  '- https://developers-apps-in-toss.toss.im/development/test/sandbox.html',
  '- https://developers-apps-in-toss.toss.im/tutorials/webview.html',
  '- https://developers-apps-in-toss.toss.im/checklist/app-game.html',
];

console.log(lines.join('\n'));

