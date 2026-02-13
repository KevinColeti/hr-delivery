import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
  ],
  controllers: [AppController],
})
export class AppModule {}
