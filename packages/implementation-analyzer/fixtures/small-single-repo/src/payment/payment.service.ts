import { OrderService } from "../order/order.service.js";

export class PaymentService {
  constructor(private readonly order: OrderService) {}

  pay(user: string, item: string): boolean {
    return this.order.placeOrder(user, item);
  }
}
