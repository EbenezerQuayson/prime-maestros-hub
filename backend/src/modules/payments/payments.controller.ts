import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { SimulateMockPaymentDto } from './dto/simulate-mock-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @OptionalAuth()
  @Post('initialize')
  initialize(
    @Body() dto: InitializePaymentDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() req: Request,
  ) {
    return this.paymentsService.initializePayment(dto, user, req.ip);
  }

  @OptionalAuth()
  @Get(':id')
  getPayment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('token') queryToken?: string,
    @Headers('x-application-token') headerToken?: string,
  ) {
    return this.paymentsService.getPayment(
      id,
      user,
      queryToken || headerToken,
    );
  }

  @OptionalAuth()
  @Post(':reference/verify')
  @HttpCode(HttpStatus.OK)
  verifyByReference(
    @Param('reference') reference: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('token') queryToken?: string,
    @Headers('x-application-token') headerToken?: string,
    @Req() req?: Request,
  ) {
    return this.paymentsService.verifyByReference(
      reference,
      user,
      queryToken || headerToken,
      req?.ip,
    );
  }

  @Public()
  @Post('mock/simulate')
  @HttpCode(HttpStatus.OK)
  simulateMock(@Body() dto: SimulateMockPaymentDto, @Req() req: Request) {
    return this.paymentsService.simulateMockPayment(dto, req.ip);
  }
}
