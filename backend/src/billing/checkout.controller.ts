import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Billing - Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class CheckoutController {
  constructor(private service: CheckoutService) {}

  @Get('preview')
  @ApiOperation({ summary: 'Prévia do preço do Pro (com cupom opcional)' })
  preview(@Query('coupon') coupon?: string) {
    return this.service.preview(coupon);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Iniciar checkout do plano Pro' })
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CreateCheckoutDto) {
    return this.service.createCheckout(user.sub, dto);
  }

  @Post('checkout/:id/confirm')
  @ApiOperation({ summary: 'Confirmar pagamento (stub do webhook)' })
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.confirm(user.sub, id);
  }

  @Get('subscriptions/me')
  @ApiOperation({ summary: 'Minhas assinaturas' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.service.listMine(user.sub);
  }
}
