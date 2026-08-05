import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AssessClaimDto, CreateClaimDto, FormulateClaimDto, ReviewClaimDto } from './dto/claims.dto';

@Controller('api/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(@Body() dto: CreateClaimDto) {
    return this.claimsService.createClaim(dto);
  }

  @Get()
  list() {
    return this.claimsService.listClaims();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.claimsService.getClaim(id);
  }

  @Patch(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewClaimDto) {
    return this.claimsService.reviewClaim(id, dto);
  }

  @Patch(':id/formulate')
  formulate(@Param('id') id: string, @Body() dto: FormulateClaimDto) {
    return this.claimsService.formulateClaim(id, dto);
  }

  @Post(':id/assess')
  assess(@Param('id') id: string, @Body() dto: AssessClaimDto) {
    return this.claimsService.assessClaim(id, dto);
  }
}
