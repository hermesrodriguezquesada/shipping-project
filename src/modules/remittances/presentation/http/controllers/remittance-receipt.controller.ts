import {
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import {
  DownloadRemittanceReceiptUseCase,
  RemittanceReceiptForbiddenError,
  RemittanceReceiptNotFoundError,
} from 'src/modules/remittances/application/use-cases/download-remittance-receipt.usecase';

@Controller('remittances')
export class RemittanceReceiptController {
  constructor(
    private readonly downloadRemittanceReceiptUseCase: DownloadRemittanceReceiptUseCase,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/receipt.pdf')
  async downloadReceipt(
    @Param('id') remittanceId: string,
    @Req() request: Request & { user?: AuthContextUser },
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    try {
      const result = await this.downloadRemittanceReceiptUseCase.execute({
        remittanceId,
        requesterUserId: user.id,
        requesterRoles: user.roles,
      });

      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      return new StreamableFile(result.pdfBuffer);
    } catch (error) {
      if (error instanceof RemittanceReceiptNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof RemittanceReceiptForbiddenError) {
        throw new ForbiddenException(error.message);
      }

      throw new InternalServerErrorException('Failed to generate remittance receipt');
    }
  }
}
