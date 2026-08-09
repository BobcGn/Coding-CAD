import { PaymentService } from "../payment/payment.service.js";

export class OrderService {
  constructor(private readonly payments: PaymentService) {}
}
