/**
 * Test Math Solver Library
 */

const {
  formatMathSolution,
  getMathSystemPrompt,
  extractFinalAnswer,
  isMathProblem,
} = require("../lib/mathSolver");

console.log("=== Testing Math Solver Library ===\n");

// Test 1: isMathProblem
console.log("Test 1: isMathProblem()");
const testCases = [
  { text: "2x + 5 = 15", expected: true },
  { text: "solve x² - 5x + 6 = 0", expected: true },
  { text: "25 × 4 + 10", expected: true },
  { text: "calculate 100 ÷ 5", expected: true },
  { text: "what is 2+2", expected: true },
  { text: "hello how are you", expected: false },
  { text: "who created you", expected: false },
  { text: "3.14159", expected: false }, // Just a number, not a problem
];

testCases.forEach((tc, i) => {
  const result = isMathProblem(tc.text);
  const status = result === tc.expected ? "✅" : "❌";
  console.log(`  ${status} Case ${i + 1}: "${tc.text}" -> ${result} (expected: ${tc.expected})`);
});

// Test 2: getMathSystemPrompt
console.log("\nTest 2: getMathSystemPrompt()");
const prompt = getMathSystemPrompt();
const hasKeyPhrases = [
  "mathematical problem solver",
  "WhatsApp",
  "numbered steps",
  "Final Answer",
].every((phrase) => prompt.includes(phrase));
console.log(`  ${hasKeyPhrases ? "✅" : "❌"} System prompt contains key phrases`);
console.log(`  Prompt length: ${prompt.length} characters`);

// Test 3: extractFinalAnswer
console.log("\nTest 3: extractFinalAnswer()");
const sampleSolutions = [
  {
    text: "Step 1: Add 5\nStep 2: Divide by 2\n\n✅ Final Answer: x = 5",
    expected: "x = 5",
  },
  {
    text: "Working... \nTherefore x = 10\nEnd",
    expected: "x = 10",
  },
  {
    text: "No answer here",
    expected: null,
  },
];

sampleSolutions.forEach((sol, i) => {
  const result = extractFinalAnswer(sol.text);
  const status = result === sol.expected ? "✅" : "❌";
  console.log(`  ${status} Case ${i + 1}: extracted "${result}" (expected: "${sol.expected}")`);
});

// Test 4: formatMathSolution
console.log("\nTest 4: formatMathSolution()");
const testSolution = `
Problem: Solve 2x + 5 = 15



Step 1: Subtract 5 from both sides
2x = 10

Step 2: Divide by 2
x = 5



Final Answer: x = 5
`;

const formatted = formatMathSolution(testSolution);
const hasProperSpacing = !formatted.includes("\n\n\n");
const notEmpty = formatted.length > 0;
console.log(`  ${hasProperSpacing ? "✅" : "❌"} Proper spacing (no triple newlines)`);
console.log(`  ${notEmpty ? "✅" : "❌"} Not empty`);
console.log(`  Formatted solution:\n${formatted}`);

console.log("\n=== All Tests Complete ===");
