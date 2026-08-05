import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ClaimsModule } from './claims/claims.module';

@Module({
  imports: [
    ClaimsModule,
    // Serves the built React app (frontend/dist -> copied to backend/public)
    // so the whole thing runs as one server for a local demo.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*splat}'],
    }),
  ],
})
export class AppModule {}
