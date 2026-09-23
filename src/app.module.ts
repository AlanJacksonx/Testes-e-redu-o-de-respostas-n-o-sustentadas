import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IaModule } from './ia/ia.module';
import { ConversasModule } from './conversas/conversas.module';
import { ChamadosModule } from './chamados/chamados.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IaModule,
    ConversasModule,
    ChamadosModule,
  ],
})
export class AppModule {}
