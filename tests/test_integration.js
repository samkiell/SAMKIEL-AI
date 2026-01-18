#!/usr/bin/env node
/**
 * Comprehensive Integration Test for SAMKIEL BOT Math Enhancement
 */

const fs = require('fs');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   SAMKIEL BOT - Math Enhancement Integration Test          ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

let passCount = 0;
let failCount = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    failCount++;
  }
}

// Test 1: File Existence
console.log('📁 File Existence Tests');
test('lib/mathSolver.js exists', fs.existsSync('lib/mathSolver.js'));
test('commands/math.js exists', fs.existsSync('commands/math.js'));
console.log('');

// Test 2: Module Loading
console.log('📦 Module Loading Tests');
try {
  const mathSolver = require('../lib/mathSolver');
  test('mathSolver module loads', true);
  test('mathSolver.isMathProblem exists', typeof mathSolver.isMathProblem === 'function');
  test('mathSolver.formatMathSolution exists', typeof mathSolver.formatMathSolution === 'function');
  test('mathSolver.getMathSystemPrompt exists', typeof mathSolver.getMathSystemPrompt === 'function');
  test('mathSolver.extractFinalAnswer exists', typeof mathSolver.extractFinalAnswer === 'function');
} catch (e) {
  test('mathSolver module loads', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

try {
  const mathCommand = require('../commands/math');
  test('mathCommand module loads', typeof mathCommand === 'function');
} catch (e) {
  test('mathCommand module loads', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 3: AI System Instruction Update
console.log('🤖 AI System Instruction Tests');
try {
  const aiCommand = require('../commands/ai');
  const { SYSTEM_INSTRUCTION } = aiCommand;
  test('AI module loads', true);
  test('SYSTEM_INSTRUCTION updated (shorter)', SYSTEM_INSTRUCTION.length < 700);
  test('Contains "Role: Core AI Engine"', SYSTEM_INSTRUCTION.includes('Role: Core AI Engine'));
  test('Contains "WhatsApp-native"', SYSTEM_INSTRUCTION.includes('WhatsApp-native'));
  test('Contains "created by SAMKIEL"', SYSTEM_INSTRUCTION.includes('created by SAMKIEL'));
  test('Removed verbose content', !SYSTEM_INSTRUCTION.includes('Obafemi Awolowo University'));
} catch (e) {
  test('AI module loads', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 4: OCR Enhancement
console.log('📸 OCR Enhancement Tests');
try {
  const { ocrCommand } = require('../commands/ocr');
  const ocrContent = fs.readFileSync('commands/ocr.js', 'utf8');
  test('OCR module loads', typeof ocrCommand === 'function');
  test('OCR imports mathSolver', ocrContent.includes('require("../lib/mathSolver")'));
  test('OCR imports mathCommand', ocrContent.includes('require("./math")'));
  test('OCR uses isMathProblem', ocrContent.includes('isMathProblem(text)'));
  test('OCR calls mathCommand', ocrContent.includes('await mathCommand('));
} catch (e) {
  test('OCR module loads', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 5: Help Menu Update
console.log('📖 Help Menu Tests');
try {
  const helpContent = fs.readFileSync('commands/help.js', 'utf8');
  test('Help includes Math Commands section', helpContent.includes('📐 *Math Commands*'));
  test('Help includes .math command', helpContent.includes('math <problem>'));
  test('Help includes .cal command', helpContent.includes('cal <expression>'));
  test('Help includes .calculate command', helpContent.includes('calculate <expression>'));
  test('Help includes .solve command', helpContent.includes('solve <equation>'));
} catch (e) {
  test('Help menu checks', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 6: Main.js Integration
console.log('🔧 Main.js Integration Tests');
try {
  const mainContent = fs.readFileSync('main.js', 'utf8');
  test('main.js imports mathCommand', mainContent.includes('require("./commands/math")'));
  test('main.js handles "math" command', mainContent.includes('cmd === "math"'));
  test('main.js handles "cal" command', mainContent.includes('cmd === "cal"'));
  test('main.js handles "calculate" command', mainContent.includes('cmd === "calculate"'));
  test('main.js handles "solve" command', mainContent.includes('cmd === "solve"'));
  test('main.js calls mathCommand', mainContent.includes('await mathCommand(sock, chatId, message)'));
} catch (e) {
  test('main.js integration', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 7: Prefix Configuration
console.log('⚙️  Prefix Configuration Tests');
try {
  const { VALID_COMMANDS } = require('../lib/prefix');
  test('VALID_COMMANDS includes "math"', VALID_COMMANDS.includes('math'));
  test('VALID_COMMANDS includes "cal"', VALID_COMMANDS.includes('cal'));
  test('VALID_COMMANDS includes "calculate"', VALID_COMMANDS.includes('calculate'));
  test('VALID_COMMANDS includes "solve"', VALID_COMMANDS.includes('solve'));
  test('VALID_COMMANDS includes "ocr"', VALID_COMMANDS.includes('ocr'));
} catch (e) {
  test('Prefix configuration', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 8: Math Problem Detection
console.log('🧮 Math Problem Detection Tests');
try {
  const { isMathProblem } = require('../lib/mathSolver');
  test('Detects "2x + 5 = 15"', isMathProblem('2x + 5 = 15'));
  test('Detects "solve x² - 5x + 6 = 0"', isMathProblem('solve x² - 5x + 6 = 0'));
  test('Detects "25 × 4 + 10"', isMathProblem('25 × 4 + 10'));
  test('Detects "calculate 100 ÷ 5"', isMathProblem('calculate 100 ÷ 5'));
  test('Ignores "hello how are you"', !isMathProblem('hello how are you'));
  test('Ignores "who created you"', !isMathProblem('who created you'));
} catch (e) {
  test('Math detection', false);
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Test 9: Syntax Validation
console.log('✔️  Syntax Validation Tests');
const { execSync } = require('child_process');
const filesToCheck = [
  'lib/mathSolver.js',
  'commands/math.js',
  'commands/ai.js',
  'commands/ocr.js',
  'commands/help.js',
  'main.js',
  'lib/prefix.js'
];

for (const file of filesToCheck) {
  try {
    execSync(`node -c ${file}`, { stdio: 'pipe' });
    test(`${file} syntax valid`, true);
  } catch (e) {
    test(`${file} syntax valid`, false);
  }
}
console.log('');

// Summary
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                       Test Summary                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total:  ${passCount + failCount}`);
console.log('');

if (failCount === 0) {
  console.log('🎉 All tests passed! SAMKIEL BOT math enhancement is ready!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}
