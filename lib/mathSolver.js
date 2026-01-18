/**
 * Math Solver Library
 * Formats math solutions for WhatsApp readability
 */

/**
 * Format a math solution for WhatsApp display
 * @param {string} solution - The raw solution text from AI
 * @returns {string} WhatsApp-optimized formatted solution
 */
function formatMathSolution(solution) {
  if (!solution) return "❌ No solution provided.";

  // Clean up the solution
  let formatted = solution.trim();

  // Remove excessive markdown that doesn't render well in WhatsApp
  formatted = formatted.replace(/\*\*\*\*/g, "**");
  formatted = formatted.replace(/```math/gi, "");
  formatted = formatted.replace(/```/g, "");

  // Ensure proper spacing between sections
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
}

/**
 * Create a math-specific system prompt for DeepSeek
 * @returns {string} System prompt for mathematical problem solving
 */
function getMathSystemPrompt() {
  return `You are a mathematical problem solver for SAMKIEL BOT, optimized for WhatsApp display.

CRITICAL FORMATTING RULES:
- Use numbered steps (1., 2., 3., etc.)
- Use proper spacing between steps
- AVOID complex LaTeX notation
- Keep solutions readable on a phone screen
- Use simple mathematical notation that WhatsApp can display
- Use plain text symbols: ÷, ×, ², ³, √, π, ∞, ≈, ≠, ≤, ≥, ±

SOLUTION STRUCTURE:
1. First, clearly state what needs to be solved
2. Show each step with explanation
3. Clearly highlight the final answer with "Final Answer:" or "Answer:"

YOU CAN SOLVE:
- Arithmetic (addition, subtraction, multiplication, division)
- Algebra (equations, expressions, factoring)
- Simultaneous equations
- Fractions and decimals
- Indices and logarithms
- Trigonometry
- Basic calculus (derivatives, integrals)
- Word problems

EXAMPLE FORMAT:
Problem: Solve 2x + 5 = 15

Step 1: Subtract 5 from both sides
2x + 5 - 5 = 15 - 5
2x = 10

Step 2: Divide both sides by 2
2x ÷ 2 = 10 ÷ 2
x = 5

✅ Final Answer: x = 5

Remember: Be clear, concise, and WhatsApp-friendly!`;
}

/**
 * Extract the final answer from a solution
 * @param {string} solution - The full solution text
 * @returns {string|null} The final answer or null if not found
 */
function extractFinalAnswer(solution) {
  if (!solution) return null;

  // Look for common answer patterns
  const patterns = [
    /(?:Final Answer|Answer|Solution):\s*(.+?)(?:\n|$)/i,
    /(?:Therefore|Thus|Hence),?\s*(.+?)(?:\n|$)/i,
    /✅\s*(.+?)(?:\n|$)/,
  ];

  for (const pattern of patterns) {
    const match = solution.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Validate if text contains a math problem
 * @param {string} text - Text to validate
 * @returns {boolean} True if text appears to contain math
 */
function isMathProblem(text) {
  if (!text) return false;

  const mathIndicators = [
    // Mathematical operators
    /[+\-×÷*/=]/,
    // Equations
    /\d+[a-z]\s*[+\-*/=]/i,
    /[a-z]\s*[+\-*/=]\s*\d+/i,
    // Math keywords
    /\b(solve|calculate|equation|simplify|factor|derivative|integral|trigonometry|logarithm|fraction)\b/i,
    // Math symbols
    /[²³√π∞≈≠≤≥±]/,
    // Patterns like "2x + 5" (more specific)
    /\d+[a-z]\b/i,
  ];

  return mathIndicators.some((pattern) => pattern.test(text));
}

module.exports = {
  formatMathSolution,
  getMathSystemPrompt,
  extractFinalAnswer,
  isMathProblem,
};
