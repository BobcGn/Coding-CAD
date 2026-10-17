import { AuthService } from "@small-monorepo/auth";
import { BillingService } from "@small-monorepo/billing";

export class GatewayService {
  constructor(
    private readonly auth: AuthService,
    private readonly billing: BillingService
  ) {}

  handleRequest(): boolean {
    return this.auth.login("token") && this.billing.charge(10);
  }
}
