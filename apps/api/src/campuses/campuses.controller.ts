import { Body, Controller, Get, HttpException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AlreadyInactiveError, BlockingDependenciesError, CampusNotFoundError, CreateCampus, DeactivateCampus, DependencyCheckUnavailableError, DuplicateCampusError, ForbiddenError, GetCampus, InvalidCampusError, ListCampuses, UnauthorizedError, UpdateCampus } from '@school-erp/application';
import type { ActorContext } from '@school-erp/application';
import { CreateCampusDto, DeactivateCampusDto, ListCampusesQueryDto, UpdateCampusDto } from './campus.dto';
import { AuthenticatedRequest, SessionAuthGuard } from '../auth/session.guard';

function handle(error: unknown): never { if (error instanceof UnauthorizedError) throw new HttpException(error.message, 401); if (error instanceof ForbiddenError) throw new HttpException(error.message, 403); if (error instanceof CampusNotFoundError) throw new HttpException(error.message, 404); if (error instanceof DuplicateCampusError || error instanceof AlreadyInactiveError || error instanceof BlockingDependenciesError) throw new HttpException(error.message, 409); if (error instanceof InvalidCampusError) throw new HttpException(error.message, 400); if (error instanceof DependencyCheckUnavailableError) throw new HttpException(error.message, 503); throw error; }
function actor(request: AuthenticatedRequest): ActorContext { if (!request.actor) throw new HttpException('Authentication required', 401); return request.actor; }

@Controller('campuses')
@UseGuards(SessionAuthGuard)
export class CampusesController {
  constructor(private readonly list: ListCampuses, private readonly get: GetCampus, private readonly create: CreateCampus, private readonly update: UpdateCampus, private readonly deactivate: DeactivateCampus) {}
  @Get() async listCampuses(@Req() request: AuthenticatedRequest, @Query() query: ListCampusesQueryDto) { try { return await this.list.execute(actor(request), query.status ?? 'active'); } catch (error) { return handle(error); } }
  @Get(':id') async getCampus(@Req() request: AuthenticatedRequest, @Param('id') id: string) { try { return await this.get.execute(actor(request), id); } catch (error) { return handle(error); } }
  @Post() async createCampus(@Req() request: AuthenticatedRequest, @Body() body: CreateCampusDto) { try { return await this.create.execute(actor(request), body); } catch (error) { return handle(error); } }
  @Patch(':id') async updateCampus(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateCampusDto) { try { return await this.update.execute(actor(request), id, body); } catch (error) { return handle(error); } }
  @Post(':id/deactivate') async deactivateCampus(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: DeactivateCampusDto) { try { return await this.deactivate.execute(actor(request), id, body.reason); } catch (error) { return handle(error); } }
}