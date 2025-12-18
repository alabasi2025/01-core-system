import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

// Event Types
export enum EventType {
  // Journal Entry Events
  JOURNAL_ENTRY_CREATED = 'journal_entry.created',
  JOURNAL_ENTRY_POSTED = 'journal_entry.posted',
  JOURNAL_ENTRY_VOIDED = 'journal_entry.voided',
  
  // Payment Order Events
  PAYMENT_ORDER_CREATED = 'payment_order.created',
  PAYMENT_ORDER_APPROVED = 'payment_order.approved',
  PAYMENT_ORDER_EXECUTED = 'payment_order.executed',
  PAYMENT_ORDER_CANCELLED = 'payment_order.cancelled',
  
  // Reconciliation Events
  RECONCILIATION_CREATED = 'reconciliation.created',
  RECONCILIATION_FINALIZED = 'reconciliation.finalized',
  RECONCILIATION_CANCELLED = 'reconciliation.cancelled',
  
  // Cash Box Events
  CASH_BOX_SESSION_OPENED = 'cash_box.session_opened',
  CASH_BOX_SESSION_CLOSED = 'cash_box.session_closed',
  CASH_BOX_TRANSACTION_CREATED = 'cash_box.transaction_created',
  
  // Collection Events
  COLLECTION_CREATED = 'collection.created',
  COLLECTION_DEPOSITED = 'collection.deposited',
  
  // Account Events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_BALANCE_CHANGED = 'account.balance_changed',
  
  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_LOGGED_IN = 'user.logged_in',
  
  // Accounting Period Events
  ACCOUNTING_PERIOD_OPENED = 'accounting_period.opened',
  ACCOUNTING_PERIOD_CLOSED = 'accounting_period.closed',
}

// Event Payload Interface
export interface EventPayload {
  eventType: EventType;
  businessId: string;
  userId?: string;
  entityId: string;
  entityType: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Event Subscriber Interface
export interface EventSubscriber {
  subscriberId: string;
  eventTypes: EventType[];
  webhookUrl?: string;
  isActive: boolean;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private subscribers: Map<string, EventSubscriber> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Emit an event to all subscribers
   */
  async emit(payload: Omit<EventPayload, 'timestamp'>): Promise<void> {
    const fullPayload: EventPayload = {
      ...payload,
      timestamp: new Date(),
    };

    this.logger.log(`Emitting event: ${payload.eventType} for entity ${payload.entityId}`);

    // Emit to internal listeners
    this.eventEmitter.emit(payload.eventType, fullPayload);

    // Store event in database for audit trail
    await this.storeEvent(fullPayload);

    // Send to external webhooks
    await this.notifyWebhooks(fullPayload);
  }

  /**
   * Store event in database for audit trail
   */
  private async storeEvent(payload: EventPayload): Promise<void> {
    try {
      await this.prisma.core_audit_logs.create({
        data: {
          businessId: payload.businessId,
          userId: payload.userId || payload.businessId, // fallback to businessId if no userId
          action: payload.eventType,
          entityType: payload.entityType,
          entityId: payload.entityId,
          newValue: JSON.stringify(payload.data),
          description: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store event: ${error.message}`);
    }
  }

  /**
   * Notify external webhooks
   */
  private async notifyWebhooks(payload: EventPayload): Promise<void> {
    const activeSubscribers = Array.from(this.subscribers.values())
      .filter(sub => sub.isActive && sub.eventTypes.includes(payload.eventType) && sub.webhookUrl);

    for (const subscriber of activeSubscribers) {
      try {
        await fetch(subscriber.webhookUrl!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Event-Type': payload.eventType,
            'X-Subscriber-Id': subscriber.subscriberId,
          },
          body: JSON.stringify(payload),
        });
        this.logger.log(`Webhook sent to ${subscriber.subscriberId}`);
      } catch (error) {
        this.logger.error(`Failed to send webhook to ${subscriber.subscriberId}: ${error.message}`);
      }
    }
  }

  /**
   * Register a subscriber
   */
  registerSubscriber(subscriber: EventSubscriber): void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    this.logger.log(`Subscriber registered: ${subscriber.subscriberId}`);
  }

  /**
   * Unregister a subscriber
   */
  unregisterSubscriber(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    this.logger.log(`Subscriber unregistered: ${subscriberId}`);
  }

  /**
   * Get all subscribers
   */
  getSubscribers(): EventSubscriber[] {
    return Array.from(this.subscribers.values());
  }

  /**
   * Listen to an event
   */
  on(eventType: EventType, callback: (payload: EventPayload) => void): void {
    this.eventEmitter.on(eventType, callback);
  }

  /**
   * Listen to an event once
   */
  once(eventType: EventType, callback: (payload: EventPayload) => void): void {
    this.eventEmitter.once(eventType, callback);
  }

  /**
   * Remove a listener
   */
  off(eventType: EventType, callback: (payload: EventPayload) => void): void {
    this.eventEmitter.off(eventType, callback);
  }

  // Convenience methods for common events

  async emitJournalEntryCreated(businessId: string, userId: string, entryId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.JOURNAL_ENTRY_CREATED,
      businessId,
      userId,
      entityId: entryId,
      entityType: 'journal_entry',
      data,
    });
  }

  async emitJournalEntryPosted(businessId: string, userId: string, entryId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.JOURNAL_ENTRY_POSTED,
      businessId,
      userId,
      entityId: entryId,
      entityType: 'journal_entry',
      data,
    });
  }

  async emitPaymentOrderCreated(businessId: string, userId: string, orderId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.PAYMENT_ORDER_CREATED,
      businessId,
      userId,
      entityId: orderId,
      entityType: 'payment_order',
      data,
    });
  }

  async emitPaymentOrderApproved(businessId: string, userId: string, orderId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.PAYMENT_ORDER_APPROVED,
      businessId,
      userId,
      entityId: orderId,
      entityType: 'payment_order',
      data,
    });
  }

  async emitPaymentOrderExecuted(businessId: string, userId: string, orderId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.PAYMENT_ORDER_EXECUTED,
      businessId,
      userId,
      entityId: orderId,
      entityType: 'payment_order',
      data,
    });
  }

  async emitReconciliationFinalized(businessId: string, userId: string, reconciliationId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.RECONCILIATION_FINALIZED,
      businessId,
      userId,
      entityId: reconciliationId,
      entityType: 'reconciliation',
      data,
    });
  }

  async emitCollectionCreated(businessId: string, userId: string, collectionId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.COLLECTION_CREATED,
      businessId,
      userId,
      entityId: collectionId,
      entityType: 'collection',
      data,
    });
  }

  async emitAccountBalanceChanged(businessId: string, accountId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.ACCOUNT_BALANCE_CHANGED,
      businessId,
      entityId: accountId,
      entityType: 'account',
      data,
    });
  }

  async emitAccountingPeriodClosed(businessId: string, userId: string, periodId: string, data: any): Promise<void> {
    await this.emit({
      eventType: EventType.ACCOUNTING_PERIOD_CLOSED,
      businessId,
      userId,
      entityId: periodId,
      entityType: 'accounting_period',
      data,
    });
  }
}
