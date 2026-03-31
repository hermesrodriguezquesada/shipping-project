import {
  Controller,
  ForbiddenException,
  Get,
  GoneException,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import {
  AdminReportExportExpiredError,
  AdminReportExportFileUnavailableError,
  AdminReportExportNotFoundError,
  DownloadAdminReportExportUseCase,
} from 'src/modules/remittances/application/use-cases/download-admin-report-export.usecase';

@Controller('admin/report-exports')
export class AdminReportExportController {
  constructor(private readonly downloadAdminReportExportUseCase: DownloadAdminReportExportUseCase) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/download')
  async download(
    @Param('id') exportId: string,
    @Req() request: Request & { user?: AuthContextUser },
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('Admin role is required');
    }

    try {
      const result = await this.downloadAdminReportExportUseCase.execute({ id: exportId });
      response.setHeader('Content-Type', result.mimeType);
      response.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      return new StreamableFile(result.fileBuffer);
    } catch (error) {
      if (error instanceof AdminReportExportNotFoundError || error instanceof AdminReportExportFileUnavailableError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof AdminReportExportExpiredError) {
        throw new GoneException(error.message);
      }

      throw error;
    }
  }
}
