import { AuthService } from "@small-monorepo/auth";

export class BillingService {
  constructor(private readonly auth: AuthService) {}

  charge(amount: number): boolean {
    return amount > 0;
  }
}
