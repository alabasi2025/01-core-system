import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType, EventPayload } from './events.service';

/**
 * Event Listeners for handling internal events
 * These listeners can be used to trigger side effects when events occur
 */
@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  /**
   * Handle journal entry posted event
   * This can trigger account balance updates, notifications, etc.
   */
  @OnEvent(EventType.JOURNAL_ENTRY_POSTED)
  handleJournalEntryPosted(payload: EventPayload) {
    this.logger.log(`Journal entry posted: ${payload.entityId}`);
    // Add any side effects here, such as:
    // - Update account balances
    // - Send notifications
    // - Trigger integrations with other systems
  }

  /**
   * Handle payment order approved event
   */
  @OnEvent(EventType.PAYMENT_ORDER_APPROVED)
  handlePaymentOrderApproved(payload: EventPayload) {
    this.logger.log(`Payment order approved: ${payload.entityId}`);
    // Add side effects like:
    // - Send notification to finance team
    // - Update payment queue
  }

  /**
   * Handle payment order executed event
   */
  @OnEvent(EventType.PAYMENT_ORDER_EXECUTED)
  handlePaymentOrderExecuted(payload: EventPayload) {
    this.logger.log(`Payment order executed: ${payload.entityId}`);
    // Add side effects like:
    // - Create journal entry for the payment
    // - Update vendor balance
    // - Send payment confirmation
  }

  /**
   * Handle reconciliation finalized event
   */
  @OnEvent(EventType.RECONCILIATION_FINALIZED)
  handleReconciliationFinalized(payload: EventPayload) {
    this.logger.log(`Reconciliation finalized: ${payload.entityId}`);
    // Add side effects like:
    // - Clear intermediary accounts
    // - Generate reconciliation report
  }

  /**
   * Handle collection created event
   */
  @OnEvent(EventType.COLLECTION_CREATED)
  handleCollectionCreated(payload: EventPayload) {
    this.logger.log(`Collection created: ${payload.entityId}`);
    // Add side effects like:
    // - Update collector balance
    // - Send receipt
  }

  /**
   * Handle collection deposited event
   */
  @OnEvent(EventType.COLLECTION_DEPOSITED)
  handleCollectionDeposited(payload: EventPayload) {
    this.logger.log(`Collection deposited: ${payload.entityId}`);
    // Add side effects like:
    // - Create journal entry
    // - Update bank account balance
  }

  /**
   * Handle accounting period closed event
   */
  @OnEvent(EventType.ACCOUNTING_PERIOD_CLOSED)
  handleAccountingPeriodClosed(payload: EventPayload) {
    this.logger.log(`Accounting period closed: ${payload.entityId}`);
    // Add side effects like:
    // - Generate period-end reports
    // - Lock transactions in the period
    // - Notify accountants
  }

  /**
   * Handle user logged in event
   */
  @OnEvent(EventType.USER_LOGGED_IN)
  handleUserLoggedIn(payload: EventPayload) {
    this.logger.log(`User logged in: ${payload.entityId}`);
    // Add side effects like:
    // - Update last login timestamp
    // - Log security event
  }

  /**
   * Handle account balance changed event
   */
  @OnEvent(EventType.ACCOUNT_BALANCE_CHANGED)
  handleAccountBalanceChanged(payload: EventPayload) {
    this.logger.log(`Account balance changed: ${payload.entityId}`);
    // Add side effects like:
    // - Check for low balance alerts
    // - Update dashboard widgets
    // - Trigger budget alerts
  }

  /**
   * Wildcard listener for all events (for logging/debugging)
   */
  @OnEvent('**')
  handleAllEvents(payload: EventPayload) {
    // Uncomment for debugging
    // this.logger.debug(`Event received: ${payload.eventType}`);
  }
}
