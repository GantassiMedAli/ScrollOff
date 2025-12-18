import { AppModule } from './app/app.module';
import { platformServer } from '@angular/platform-server';

const bootstrap = () => platformServer().bootstrapModule(AppModule);

export default bootstrap;
