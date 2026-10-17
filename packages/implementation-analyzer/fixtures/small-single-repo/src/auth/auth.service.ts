import { LoggerService } from "../core/logger.service.js";

export class AuthService {
  constructor(private readonly logger: LoggerService) {}

  authenticate(user: string): boolean {
    this.logger.log(`Authenticating user: ${user}`);
    return user.length > 0;
  }
}
