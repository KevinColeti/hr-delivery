import { Injectable } from '@nestjs/common';

type StructuredLogLevel = 'info' | 'error';

@Injectable()
/**
 * Logger simples em JSON para padronizar rastreabilidade.
 *
 * O objetivo e manter logs parseaveis por ferramentas externas
 * sem acoplar o projeto agora a uma stack de observabilidade especifica.
 */
export class StructuredLoggerService {
  /**
   * Emite log de informacao em formato JSON.
   */
  info(message: string, context: Record<string, unknown>) {
    this.emit('info', message, context);
  }

  /**
   * Emite log de erro em formato JSON.
   */
  error(message: string, context: Record<string, unknown>) {
    this.emit('error', message, context);
  }

  /**
   * Serializa evento de log de forma consistente.
   */
  private emit(level: StructuredLogLevel, message: string, context: Record<string, unknown>) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(payload));
      return;
    }

    console.log(JSON.stringify(payload));
  }
}
