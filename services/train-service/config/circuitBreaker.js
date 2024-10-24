const CircuitBreaker = require("opossum");

const defaultOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

function createBreaker(fn, options = {}) {
  const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });

  breaker.fallback(() => {
    throw new Error("Service unavailable");
  });

  return breaker;
}

module.exports = createBreaker;
