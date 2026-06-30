const { catchAsync } = require("../../../shared/utils/catchAsync");
const pawapay = require("../services/pawapay.service");
const subscriptionService = require("../services/subscription.service");
const orderService = require("../../orders/services/order.service");
const { prisma } = require("../../../config/db.config");

const handlePawapayWebhook = catchAsync(async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const event = pawapay.parseWebhook(req.body);

    const [subscriptionPayment, orderPayment] = await Promise.all([
      prisma.subscriptionPayment.findUnique({
        where: { pawapayDepositId: event.depositId },
      }),
      prisma.orderPayment.findUnique({
        where: { pawapayDepositId: event.depositId },
      }),
    ]);

    if (subscriptionPayment) {
      if (event.status === "COMPLETED") {
        await subscriptionService.activateSubscription({
          pawapayDepositId: event.depositId,
          paidAt: event.completedAt ?? new Date(),
        });
        console.log(`✅ Subscription payment completed: ${event.depositId}`);
      } else if (event.status === "FAILED") {
        await subscriptionService.failPayment({
          pawapayDepositId: event.depositId,
          failureReason: event.failureReason,
          failedAt: new Date(),
        });
        console.log(`❌ Subscription payment failed: ${event.depositId}`);
      }
    } else if (orderPayment) {
      if (event.status === "COMPLETED") {
        await orderService.confirmOrderPayment({
          pawapayDepositId: event.depositId,
          paidAt: event.completedAt ?? new Date(),
        });
        console.log(`✅ Order payment completed: ${event.depositId}`);
      } else if (event.status === "FAILED") {
        await prisma.orderPayment.update({
          where: { pawapayDepositId: event.depositId },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            failureReason: event.failureReason ?? null,
          },
        });
        console.log(`❌ Order payment failed: ${event.depositId}`);
        // TODO: notify buyer, restore stock when wallet feature is built
      }
    } else {
      console.warn(
        `⚠️  PawaPay webhook: deposit not found: ${event.depositId}`,
      );
    }
  } catch (err) {
    console.error("⚠️  PawaPay webhook error:", err.message);
  }
});

module.exports = { handlePawapayWebhook };
