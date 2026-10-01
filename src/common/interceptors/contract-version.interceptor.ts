import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { readContractVersion } from '../utils/contract-version';

@Injectable()
export class ContractVersionInterceptor implements NestInterceptor {
  private readonly version: string;

  constructor() {
    this.version = readContractVersion();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context
      .switchToHttp()
      .getResponse<{ setHeader: (name: string, value: string) => void }>();
    response.setHeader('X-Contract-Version', this.version);
    return next.handle();
  }
}
