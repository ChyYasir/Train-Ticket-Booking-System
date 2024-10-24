const CircuitBreaker = require("opossum");
const createBreaker = require("../../../config/circuitBreaker");

jest.mock("opossum");

describe("Circuit Breaker", () => {
  it("should create a circuit breaker with default options", () => {
    const mockFunction = jest.fn();
    createBreaker(mockFunction);

    expect(CircuitBreaker).toHaveBeenCalledWith(
      mockFunction,
      expect.objectContaining({
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      })
    );
  });

  it("should allow overriding default options", () => {
    const mockFunction = jest.fn();
    const customOptions = { timeout: 10000 };
    createBreaker(mockFunction, customOptions);

    expect(CircuitBreaker).toHaveBeenCalledWith(
      mockFunction,
      expect.objectContaining({
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      })
    );
  });
});
