import stripe from '../config/stripe';
import appEvents from '../utils/eventEmitter';
import bookingRepository from '../repositories/BookingRepository';
import { IBookingRepository } from '../repositories/interfaces/IBookingRepository';
import { IBooking } from '../models/Booking';

/**
 * PaymentService — all Stripe webhook and retry-payment logic.
 * Completely decoupled from HTTP layer.
 * Implements DIP via IBookingRepository injection.
 */
export class PaymentService {
  constructor(
    private readonly bookingRepo: IBookingRepository = bookingRepository
  ) {}

  /**
   * Handle a Stripe `payment_intent.succeeded` webhook event.
   * Idempotent — safe to call multiple times for the same payment.
   */
  async handlePaymentSuccess(
    paymentIntentId: string,
    bookingId: string
  ): Promise<void> {
    const booking = await this.bookingRepo.atomicConfirm(
      bookingId,
      paymentIntentId,
      {
        fromStatus: 'pending',
        toStatus: 'confirmed',
        actor: 'system',
        reason: 'Payment confirmed via Stripe webhook',
        changedAt: new Date(),
      }
    );

    if (booking) {
      appEvents.emit('booking.created', {
        userName: (booking.user as unknown as { name?: string })?.name || 'Customer',
        userEmail: (booking.user as unknown as { email?: string })?.email || 'customer@example.com',
        serviceName: (booking.service as unknown as { title?: string })?.title || 'Service',
        startDate: booking.startDate.toLocaleDateString('en-IN'),
        endDate: booking.endDate.toLocaleDateString('en-IN'),
        totalDays: booking.totalDays,
        totalPrice: booking.totalPrice,
        bookingId: booking._id.toString(),
        ...(booking.timeSlotId && {
          timeSlot: `${booking.startTime} – ${booking.endTime}`,
        }),
        ...(booking.guestCount && { guestCount: booking.guestCount }),
      });
    }
  }

  /**
   * Handle a Stripe `payment_intent.payment_failed` webhook event.
   * Cancels the pending booking to free the reserved slot.
   */
  async handlePaymentFailure(bookingId: string): Promise<void> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (booking && booking.status === 'pending' && booking.paymentStatus === 'unpaid') {
      booking.status = 'cancelled';
      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        fromStatus: 'pending',
        toStatus: 'cancelled',
        actor: 'system',
        reason: 'Auto-cancelled due to payment failure',
        changedAt: new Date(),
      });
      await this.bookingRepo.save(booking);
    }
  }

  /**
   * Retry or resume payment for a pending booking.
   * Reuses an existing PaymentIntent when possible to avoid multiple charge opportunities.
   */
  async retryPayment(
    userId: string,
    bookingId: string
  ): Promise<{ booking: IBooking; clientSecret?: string; alreadyConfirmed?: boolean; processing?: boolean }> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });

    if (booking.user.toString() !== userId) {
      throw Object.assign(new Error('You can only retry payment for your own booking'), { statusCode: 403 });
    }

    if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') {
      throw Object.assign(new Error('Only pending unpaid bookings can be paid again'), { statusCode: 400 });
    }

    if (booking.pendingStripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(booking.pendingStripePaymentIntentId);

      if (existing.status === 'succeeded') {
        const confirmed = await this.bookingRepo.atomicConfirm(
          bookingId,
          existing.id,
          {
            fromStatus: 'pending',
            toStatus: 'confirmed',
            actor: 'system',
            reason: 'Confirmed via retry-payment (webhook missed)',
            changedAt: new Date(),
          }
        );

        if (confirmed) {
          appEvents.emit('booking.created', {
            userName: (confirmed.user as unknown as { name?: string })?.name || 'Customer',
            userEmail: (confirmed.user as unknown as { email?: string })?.email || 'customer@example.com',
            serviceName: (confirmed.service as unknown as { title?: string })?.title || 'Service',
            startDate: confirmed.startDate.toLocaleDateString('en-IN'),
            endDate: confirmed.endDate.toLocaleDateString('en-IN'),
            totalDays: confirmed.totalDays,
            totalPrice: confirmed.totalPrice,
            bookingId: confirmed._id.toString(),
          });
        }
        return { booking: confirmed ?? booking, alreadyConfirmed: true };
      }

      if (existing.status === 'processing') {
        return { booking, processing: true };
      }

      if (existing.status === 'requires_payment_method' && existing.client_secret) {
        return { booking, clientSecret: existing.client_secret };
      }

      if (existing.status !== 'canceled') {
        await stripe.paymentIntents.cancel(existing.id);
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'inr',
      metadata: { bookingId: booking._id.toString() },
    });

    if (!intent.client_secret) {
      throw Object.assign(new Error('Could not prepare a payment session. Please try again.'), { statusCode: 502 });
    }

    booking.pendingStripePaymentIntentId = intent.id;
    await this.bookingRepo.save(booking);

    return { booking, clientSecret: intent.client_secret };
  }
}

export default new PaymentService();
