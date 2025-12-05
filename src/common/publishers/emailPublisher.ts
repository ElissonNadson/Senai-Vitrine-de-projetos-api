import amqplib from 'amqplib';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailRecipient;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  [key: string]: any;
}

/**
 * Enfileira um email na fila RabbitMQ configurada por `RABBITMQ_URL` e `EMAIL_QUEUE_NAME`.
 * Este módulo apenas publica a mensagem; o microserviço de envio (`/email`) consome e dispara.
 */
export async function enqueueEmail(email: EmailMessage): Promise<void> {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const QUEUE = process.env.EMAIL_QUEUE_NAME || 'email_queue';

  const conn = await amqplib.connect(RABBITMQ_URL);
  try {
    const ch = await conn.createConfirmChannel();

    // tenta declarar como quorum, cai para durable se já existir com argumentos diferentes
    try {
      await ch.assertQueue(QUEUE, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
    } catch (err: any) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes('PRECONDITION_FAILED') || msg.includes('inequivalent arg')) {
        // fila existente com args diferentes, declara como classic durable
        console.warn('Queue exists with different arguments; declaring as standard durable queue');
        try {
          await ch.assertQueue(QUEUE, { durable: true });
        } catch (e) {
          // se declarar falhar porque canal foi fechado, cria novo canal e tenta novamente
          try {
            try { await ch.close(); } catch (closeErr) {}
            const ch2 = await conn.createConfirmChannel();
            await ch2.assertQueue(QUEUE, { durable: true });
            await ch2.sendToQueue(QUEUE, Buffer.from(JSON.stringify(email)), { persistent: true });
            await ch2.waitForConfirms();
            try { await ch2.close(); } catch (e) {}
            return;
          } catch (e2) {
            throw e2;
          }
        }
      } else {
        throw err;
      }
    }

    // publica persistente e aguarda confirm
    ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(email)), { persistent: true });
    if (typeof (ch as any).waitForConfirms === 'function') {
      await (ch as any).waitForConfirms();
    }

    try { await ch.close(); } catch (e) {}
  } finally {
    try { await conn.close(); } catch (e) {}
  }
}

export default enqueueEmail;
