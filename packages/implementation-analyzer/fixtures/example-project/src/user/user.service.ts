import { createClient } from "redis";

export class UserService {
  readonly cache = createClient();
}
