import { Client } from "pg";

export class PaymentService {
  constructor(private readonly client: Client) {}
}
