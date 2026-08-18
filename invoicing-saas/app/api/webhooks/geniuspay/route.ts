import { processGeniusPayWebhookRequest } from '@/lib/services/geniusPayWebhookHandler';

export async function GET() {
  return Response.json(
    { status: 'OK', message: 'GeniusPay Webhook Endpoint Active (Send POST for webhooks)' },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  return processGeniusPayWebhookRequest(req);
}
