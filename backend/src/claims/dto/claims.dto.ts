import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

// Business team step
export class CreateClaimDto {
  @IsString() productId: string;
  @IsString() claimText: string;
  @IsIn(['efficacy', 'sensory', 'environmental'])
  claimType: string;
}

// Claim manager step
export class ReviewClaimDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reason?: string;
}

// Scientist step
export class FormulateClaimDto {
  @IsString() formulaRef: string;
}

// Evaluator step -> triggers AI assessment
export class AssessClaimDto {
  @IsString() evidenceText: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sampleSize?: number;
}
