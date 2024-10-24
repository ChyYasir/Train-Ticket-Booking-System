const CircuitBreaker = require("opossum");

const defaultOptions = {
  timeout: 5000, // If our function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again.
};

function createBreaker(fn, options = {}) {
  return new CircuitBreaker(fn, { ...defaultOptions, ...options });
}

module.exports = createBreaker;
