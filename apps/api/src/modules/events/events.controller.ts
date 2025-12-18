import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EventsService, EventSubscriber, EventType } from './events.service';

class RegisterSubscriberDto {
  subscriberId: string;
  eventTypes: EventType[];
  webhookUrl?: string;
}

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all available event types' })
  getEventTypes() {
    return {
      eventTypes: Object.values(EventType),
      categories: {
        journal_entry: [
          EventType.JOURNAL_ENTRY_CREATED,
          EventType.JOURNAL_ENTRY_POSTED,
          EventType.JOURNAL_ENTRY_VOIDED,
        ],
        payment_order: [
          EventType.PAYMENT_ORDER_CREATED,
          EventType.PAYMENT_ORDER_APPROVED,
          EventType.PAYMENT_ORDER_EXECUTED,
          EventType.PAYMENT_ORDER_CANCELLED,
        ],
        reconciliation: [
          EventType.RECONCILIATION_CREATED,
          EventType.RECONCILIATION_FINALIZED,
          EventType.RECONCILIATION_CANCELLED,
        ],
        cash_box: [
          EventType.CASH_BOX_SESSION_OPENED,
          EventType.CASH_BOX_SESSION_CLOSED,
          EventType.CASH_BOX_TRANSACTION_CREATED,
        ],
        collection: [
          EventType.COLLECTION_CREATED,
          EventType.COLLECTION_DEPOSITED,
        ],
        account: [
          EventType.ACCOUNT_CREATED,
          EventType.ACCOUNT_UPDATED,
          EventType.ACCOUNT_BALANCE_CHANGED,
        ],
        user: [
          EventType.USER_CREATED,
          EventType.USER_UPDATED,
          EventType.USER_LOGGED_IN,
        ],
        accounting_period: [
          EventType.ACCOUNTING_PERIOD_OPENED,
          EventType.ACCOUNTING_PERIOD_CLOSED,
        ],
      },
    };
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Get all registered subscribers' })
  getSubscribers() {
    return this.eventsService.getSubscribers();
  }

  @Post('subscribers')
  @ApiOperation({ summary: 'Register a new event subscriber' })
  registerSubscriber(@Body() dto: RegisterSubscriberDto) {
    const subscriber: EventSubscriber = {
      ...dto,
      isActive: true,
    };
    this.eventsService.registerSubscriber(subscriber);
    return { message: 'Subscriber registered successfully', subscriber };
  }

  @Delete('subscribers/:subscriberId')
  @ApiOperation({ summary: 'Unregister an event subscriber' })
  unregisterSubscriber(@Param('subscriberId') subscriberId: string) {
    this.eventsService.unregisterSubscriber(subscriberId);
    return { message: 'Subscriber unregistered successfully' };
  }
}
