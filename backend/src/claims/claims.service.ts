import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { AssessClaimDto, CreateClaimDto, FormulateClaimDto, ReviewClaimDto } from './dto/claims.dto';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}

  // 1. Business team: create a claim, status = PENDING
  async createClaim(dto: CreateClaimDto) {
    return this.prisma.claim.create({
      data: {
        productId: dto.productId,
        claimText: dto.claimText,
        claimType: dto.claimType,
        status: 'PENDING',
      },
    });
  }

  // 2. Claim manager: approve or reject, with a reason
  async reviewClaim(claimId: string, dto: ReviewClaimDto) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.status !== 'PENDING') {
      throw new BadRequestException(`Claim is not pending review (current status: ${claim.status})`);
    }
    return this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: dto.decision,
        rejectionReason: dto.decision === 'REJECTED' ? dto.reason ?? 'No reason provided' : null,
      },
    });
  }

  // 3. Scientist: attach a formula reference once a claim is approved
  async formulateClaim(claimId: string, dto: FormulateClaimDto) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.status !== 'APPROVED') {
      throw new BadRequestException(`Claim must be APPROVED before formulation (current status: ${claim.status})`);
    }
    return this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'FORMULATED', formulaRef: dto.formulaRef },
    });
  }

  // 4 + 5. Evaluator submits evidence -> AI assesses -> result saved -> returned to client
  //
  // FORMULATED = first assessment for this claim.
  // ASSESSED   = claim already has at least one assessment, but we still allow a
  //              deliberate re-submission (new study, revised formula) — this is the
  //              retry loop discussed in the write-up, not an accidental duplicate.
  //              The frontend gates this behind an explicit "submit additional
  //              evidence" action instead of always showing the form.
  async assessClaim(claimId: string, dto: AssessClaimDto) {
    const claim = await this.getClaimOrThrow(claimId);
    if (claim.status !== 'FORMULATED' && claim.status !== 'ASSESSED') {
      throw new BadRequestException(
        `Claim must be FORMULATED before assessment (current status: ${claim.status})`,
      );
    }

    const result = await this.openai.assessClaim({
      claimText: claim.claimText,
      evidenceText: dto.evidenceText,
      sampleSize: dto.sampleSize,
    });

    const assessment = await this.prisma.assessment.create({
      data: {
        claimId,
        evidenceText: dto.evidenceText,
        sampleSize: dto.sampleSize,
        justified: result.justified,
        confidenceScore: result.confidenceScore,
        reasoning: result.reasoning,
      },
    });

    // Move the claim to ASSESSED so the UI treats it as "done" by default,
    // while still permitting an explicit re-open for another round of evidence.
    await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'ASSESSED' },
    });

    return assessment;
  }

  async listClaims() {
    return this.prisma.claim.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assessments: true },
    });
  }

  async getClaim(claimId: string) {
    return this.getClaimOrThrow(claimId);
  }

  private async getClaimOrThrow(claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { assessments: true },
    });
    if (!claim) throw new NotFoundException(`Claim ${claimId} not found`);
    return claim;
  }
}
