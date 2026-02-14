import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { CategoriesModule } from './categories/categories.module';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor';
import { StructuredLoggerService } from './common/logging/structured-logger.service';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware';
import { getDatabaseConfig } from './database/database.config';
import { IngredientsModule } from './ingredients/ingredients.module';
import { ProductIngredientsModule } from './product-ingredients/product-ingredients.module';
import { ProductExtrasModule } from './product-extras/product-extras.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    CategoriesModule,
    IngredientsModule,
    ProductsModule,
    ProductIngredientsModule,
    ProductExtrasModule,
    OrdersModule,
    StockMovementsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    StructuredLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
/**
 * Modulo raiz da API.
 */
export class AppModule implements NestModule {
  /**
   * Aplica middleware de correlacao em todas as rotas HTTP.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
