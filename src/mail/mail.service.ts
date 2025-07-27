import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
    constructor(private config: ConfigService) {}

    async sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
        const apiKey = this.config.get('BREVO_API_KEY');
        const sender = this.config.get('BREVO_SENDER_EMAIL');

        try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
            sender: { name: '驗證中心', email: sender },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            },
            {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
            },
        );
        } catch (error) {
        console.error('📬 寄送失敗:', error?.response?.data || error.message);
        throw error;
        }
    }
}