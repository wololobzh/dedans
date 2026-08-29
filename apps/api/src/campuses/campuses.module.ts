import { Module } from '@nestjs/common';
import { DatabaseService, PrismaCampusRepository, PrismaCampusTransaction } from '@school-erp/database';
import { CreateCampus, DeactivateCampus, GetCampus, ListCampuses, UpdateCampus } from '@school-erp/application';
import { CampusesController } from './campuses.controller';
import { HmacSessionVerifier, SessionAuthGuard } from '../auth/session.guard';

const transaction = Symbol('CampusTransaction');
@Module({ controllers: [CampusesController], providers: [DatabaseService, HmacSessionVerifier, SessionAuthGuard, { provide: transaction, inject: [DatabaseService], useFactory: (db: DatabaseService) => new PrismaCampusTransaction(db) }, { provide: ListCampuses, inject: [DatabaseService], useFactory: (db: DatabaseService) => new ListCampuses(new PrismaCampusRepository(db)) }, { provide: GetCampus, inject: [DatabaseService], useFactory: (db: DatabaseService) => new GetCampus(new PrismaCampusRepository(db)) }, { provide: CreateCampus, inject: [transaction], useFactory: (tx: PrismaCampusTransaction) => new CreateCampus(tx) }, { provide: UpdateCampus, inject: [transaction], useFactory: (tx: PrismaCampusTransaction) => new UpdateCampus(tx) }, { provide: DeactivateCampus, inject: [transaction], useFactory: (tx: PrismaCampusTransaction) => new DeactivateCampus(tx) }], exports: [DatabaseService] })
export class CampusesModule {}