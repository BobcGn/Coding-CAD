import { AuthService } from "../auth/auth.service.js";
import { LoggerService } from "../core/logger.service.js";

export class OrderService {
  constructor(
    private readonly auth: AuthService,
    private readonly logger: LoggerService
  ) {}

  placeOrder(user: string, item: string): boolean {
    if (!this.auth.authenticate(user)) return false;
    this.logger.log(`Order placed for ${item}`);
    return true;
  }
}
