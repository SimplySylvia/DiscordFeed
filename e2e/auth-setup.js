const fs = require('fs');
const path = require('path');

const authFile = path.join(__dirname, '.auth', 'user.json');

if (!fs.existsSync(authFile)) {
  console.log('\nAuth state not found.');
  console.log('Please run the following command manually to set up authentication:');
  console.log('  npx playwright test e2e/auth.setup.spec.ts --headed --project=chromium');
  console.log('After logging in and saving state, re-run your tests.\n');
  process.exit(1); // Exit with error so CI/local user knows to do this step
} else {
  console.log('Auth state already exists. Skipping auth setup.');
}
