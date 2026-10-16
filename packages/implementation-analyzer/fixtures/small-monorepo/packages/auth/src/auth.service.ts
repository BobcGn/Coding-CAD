export class AuthService {
  login(token: string): boolean {
    return token.length > 0;
  }
}
