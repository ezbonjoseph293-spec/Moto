/** Thrown when code tries to read or write another tenant's rows through a scoped client. */
export class TenancyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenancyViolationError";
  }
}
