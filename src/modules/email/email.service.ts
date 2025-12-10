import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import amqplib, { Connection, Channel, ConsumeMessage } from 'amqplib';
import nodemailer, { Transporter } from 'nodemailer';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailMessage {
  to: EmailRecipient;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  [key: string]: any;
}

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private conn: Connection | null = null;
  private channel: Channel | null = null;
  private transporter: Transporter | null = null;
  private queueName: string = process.env.EMAIL_QUEUE_NAME || 'email_queue';
  private rabbitUrl: string = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  async onModuleInit(): Promise<void> {
    // Só inicializa consumidor se habilitado
    if (process.env.SEND_EMAIL_NOTIFICATIONS !== 'true') {
      this.logger.log('Envio de emails via RabbitMQ desabilitado (SEND_EMAIL_NOTIFICATIONS != true)');
      return;
    }

    // Inicializa transporte SMTP
    try {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

      if (!host || !user || !pass) {
        this.logger.error('Variáveis SMTP ausentes: defina SMTP_HOST, SMTP_USER e SMTP_PASS');
      } else {
        this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
        await this.transporter.verify();
        this.logger.log('Transporter SMTP verificado com sucesso');
      }
    } catch (err: any) {
      this.logger.error(`Falha ao inicializar SMTP: ${err?.message || err}`);
    }

    // Conecta ao RabbitMQ e inicia consumo
    try {
      this.conn = await amqplib.connect(this.rabbitUrl);
      this.channel = await this.conn.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      await this.channel.prefetch(5);

      await this.channel.consume(this.queueName, async (msg) => {
        if (!msg) return;
        try {
          const content = msg.content.toString('utf-8');
          const email: EmailMessage = JSON.parse(content);
          await this.sendEmail(email);
          this.channel!.ack(msg);
        } catch (err: any) {
          this.logger.error(`Erro ao processar mensagem: ${err?.message || err}`);
          // reencaminha a mensagem para nova tentativa
          this.channel!.nack(msg, false, true);
        }
      }, { noAck: false });

      this.logger.log(`Consumidor de emails iniciado na fila: ${this.queueName}`);
    } catch (err: any) {
      this.logger.error(`Falha ao conectar ao RabbitMQ: ${err?.message || err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.conn) {
        await this.conn.close();
      }
    } catch (_) {}
  }

  private async sendEmail(email: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Transporter SMTP não inicializado; descartando envio');
      return;
    }

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const to = email.to?.email;
    const name = email.to?.name;
    const subject = email.subject || '(sem assunto)';
    const text = email.textContent || undefined;
    const html = email.htmlContent || undefined;

    if (!to) {
      this.logger.warn('Mensagem de email sem destinatário válido; ignorando');
      return;
    }

    await this.transporter.sendMail({
      from,
      to: name ? `${name} <${to}>` : to,
      subject,
      text,
      html,
    });
    this.logger.log(`Email enviado para ${to} | Assunto: ${subject}`);
  }
}