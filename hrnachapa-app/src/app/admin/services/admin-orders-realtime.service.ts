import { Injectable } from '@angular/core';
import { AdminAuthService } from './admin-auth.service';
import { AdminOrderStatus } from './admin-orders.service';

export interface AdminOrdersRealtimeEvent {
  id: number;
  type: 'order_created' | 'order_status_changed';
  orderId: number;
  status: AdminOrderStatus;
  previousStatus?: AdminOrderStatus;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Cliente SSE autenticado para eventos de pedidos no painel admin.
 *
 * Motivo:
 * EventSource nativo nao permite header Authorization; usar `fetch` com stream
 * permite manter JWT no header e evitar token em query string.
 */
export class AdminOrdersRealtimeService {
  private readonly baseUrl = 'http://localhost:3000/orders';

  /**
   * Injeta sessao admin para ler token JWT atual.
   */
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * Conecta stream geral de pedidos.
   */
  connectOrdersStream(
    onEvent: (event: AdminOrdersRealtimeEvent) => void,
    onError?: (message: string) => void,
  ) {
    return this.connectStream('/stream', onEvent, onError);
  }

  /**
   * Conecta stream focado no monitor da cozinha.
   */
  connectKitchenStream(
    onEvent: (event: AdminOrdersRealtimeEvent) => void,
    onError?: (message: string) => void,
  ) {
    return this.connectStream('/kitchen/stream', onEvent, onError);
  }

  /**
   * Implementa conexao SSE com parse incremental de blocos de evento.
   */
  private connectStream(
    path: '/stream' | '/kitchen/stream',
    onEvent: (event: AdminOrdersRealtimeEvent) => void,
    onError?: (message: string) => void,
  ) {
    const token = this.adminAuthService.token();
    if (!token) {
      onError?.('Sessao administrativa invalida para stream.');
      return () => {};
    }

    const controller = new AbortController();
    let isClosed = false;

    void (async () => {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok || !response.body) {
          onError?.(`Falha ao conectar stream (${response.status}).`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isClosed) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          buffer = this.consumeSseBuffer(buffer, onEvent);
        }
      } catch (error) {
        if (isClosed || controller.signal.aborted) {
          return;
        }

        onError?.(this.resolveStreamErrorMessage(error));
      }
    })();

    return () => {
      isClosed = true;
      controller.abort();
    };
  }

  /**
   * Processa blocos SSE completos e preserva fragmento pendente no buffer.
   */
  private consumeSseBuffer(
    rawBuffer: string,
    onEvent: (event: AdminOrdersRealtimeEvent) => void,
  ) {
    let buffer = rawBuffer;
    let boundaryMatch = buffer.match(/\r?\n\r?\n/);

    while (boundaryMatch && boundaryMatch.index !== undefined) {
      const boundaryIndex = boundaryMatch.index;
      const boundaryLength = boundaryMatch[0].length;
      const rawBlock = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + boundaryLength);
      boundaryMatch = buffer.match(/\r?\n\r?\n/);

      const parsed = this.parseSseEventBlock(rawBlock);
      if (parsed) {
        onEvent(parsed);
      }
    }

    return buffer;
  }

  /**
   * Interpreta bloco SSE e retorna evento validado quando houver payload.
   */
  private parseSseEventBlock(rawBlock: string): AdminOrdersRealtimeEvent | null {
    if (rawBlock.length === 0) {
      return null;
    }

    const dataLines = rawBlock
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());
    if (dataLines.length === 0) {
      return null;
    }

    const rawData = dataLines.join('\n');
    try {
      const parsed = JSON.parse(rawData) as Partial<AdminOrdersRealtimeEvent>;
      if (
        typeof parsed.id !== 'number' ||
        typeof parsed.orderId !== 'number' ||
        typeof parsed.status !== 'string' ||
        typeof parsed.type !== 'string' ||
        typeof parsed.createdAt !== 'string'
      ) {
        return null;
      }

      return {
        id: parsed.id,
        type: parsed.type,
        orderId: parsed.orderId,
        status: parsed.status as AdminOrderStatus,
        previousStatus: parsed.previousStatus as AdminOrderStatus | undefined,
        createdAt: parsed.createdAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Padroniza mensagem de erro para falhas de stream.
   */
  private resolveStreamErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Nao foi possivel manter conexao em tempo real com pedidos.';
  }
}
