import { execSync } from 'child_process';
import * as path from 'path';

const scriptsToRun = [
  { name: 'LOOP 3 Security Suite', script: 'scripts/test_security_suite.ts' },
  { name: 'LOOP 4 Offensive Security Suite', script: 'scripts/test_loop4_security.ts' },
  { name: 'LOOP 4.5 Payment Security Suite', script: 'scripts/test_loop4_5_payment_security.ts' },
  { name: 'LOOP 5 Profile & Settings Suite', script: 'scripts/test_loop5_settings.ts' },
  { name: 'LOOP 6 Client CRUD & Unlimited Suite', script: 'scripts/test_loop6_clients.ts' },
  { name: 'LOOP 7 Invoice Creation & Tax Suite', script: 'scripts/test_loop7_create_invoice.ts' },
  { name: 'LOOP 8 Dashboard & Financial Stats Suite', script: 'scripts/test_loop8_dashboard.ts' },
  { name: 'LOOP 9 Email & Payment Links Suite', script: 'scripts/test_loop9_email_and_payment_links.ts' },
  { name: 'Auth & Session Isolation Suite', script: 'scripts/test_auth_and_session_isolation.ts' },
];

async function runAllLoopsRegression() {
  console.log('================================================================');
  console.log('REGRESSION AUDIT GLOBAL : VERIFICATION TOUTES LOOPS (1 -> 9)');
  console.log('================================================================\n');

  let passedSuites = 0;
  let failedSuites = 0;

  for (const item of scriptsToRun) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`EXECUTION DE LA SUITE DE TESTS : ${item.name}`);
    console.log(`----------------------------------------------------------------`);

    try {
      const output = execSync(`npx tsx ${item.script}`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe',
      });
      console.log(output);
      console.log(`✅ ${item.name} -> PASSED WITH 100% SUCCESS !`);
      passedSuites++;
    } catch (err: any) {
      console.error(`❌ ${item.name} -> FAILED WITH ERROR :`);
      console.error(err.stdout || err.message);
      failedSuites++;
    }
  }

  console.log('\n================================================================');
  console.log(`BILAN DU REGRESSION AUDIT (LOOPS 1 -> 9) :`);
  console.log(`SUITES EN SUCCÈS : ${passedSuites} / ${scriptsToRun.length}`);
  console.log(`SUITES EN ÉCHEC : ${failedSuites} / ${scriptsToRun.length}`);
  console.log('================================================================\n');

  if (failedSuites > 0) {
    process.exit(1);
  }
}

runAllLoopsRegression();
