import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { leads } from './db/schema';
import { createDb } from './db';
import { sendLeadNotifications } from "./lib/email";
import { checkRateLimit } from "./lib/rate-limiter";

type Bindings = {
    DATABASE_URL: string;
    FRONTEND_URL?: string;
    RESEND_API_KEY?: string;
    ADMIN_EMAIL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', async (c, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    c.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || allowedOrigins[0];
      }
      return null;
    },
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

const serviceTypes = [
  'incident-triage',
  'workflow-automation',
  'telemetry-sync',
  'custom-integration',
] as const;

// Validasyon Şeması
const leadSchema = z.object({
    fullName: z
        .string()
        .min(3, 'İsim en az 3 karakter olmalıdır.')
        .max(80, 'İsim 80 karakterden uzun olamaz')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'İsim yalnızca harflerden oluşmalıdır.'),
    email: z
        .string()
        .email('Geçerli bir e-posta adresi giriniz.')
        .max(120, 'E-posta çok uzun.'),
    serviceType: z.enum(serviceTypes, {
        message: 'Lütfen geçerli bir hizmet türü seçiniz.',
    }),
    description: z
        .string()
        .min(20, 'Talebi anlamamız için en az 20 karakter açıklama yazınız.')
        .max(1000, 'Açıklama 1000 karakteri geçemez.'),
});

// Sistem Sağlık Kontrolü
app.get('/health', (c) => c.json({status: 'ok', service: 'OpsPulse API'}));

// Talep Kayıt Endpoint'i
app.post('/api/leads', async(c) => {
    try {

        // 1. IP Bazlı In-Memory Rate Limiting (1 dakikada maks 5 istek)
        const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(clientIp, { limit: 5, windowMs: 60_000 });

        if (!rateCheck.allowed) {
        return c.json(
            {
            success: false,
            message: `Çok fazla istek gönderildi. Lütfen ${rateCheck.resetInSec} saniye sonra tekrar deneyiniz.`,
            },
            429
        );
        }

        const body = await c.req.json();

        // 2. Zod ile sunucu tarafı sıkı doğrulama
        const parseResult = leadSchema.safeParse(body);

        if (!parseResult.success) {
            return c.json(
                {
                    success: false,
                    errors: parseResult.error.flatten().fieldErrors,
                    message: 'Girilen bilgilerde doğrulama hatası mevcut.',
                },
                400
            );
        }

        const { fullName, email, serviceType, description } = parseResult.data;

        
        // 3. Bot koruması
        if (body.website && body.website.trim() !== '') {
            // Bot yakalandı: sessizce başarılı mesajı döndür.
            return c.json({ success: true, message: 'Talebiniz alındı.' }, 201);
        }
        
        // 4. Tip güvenli insert ve returning
        const db = createDb(c.env.DATABASE_URL);
        
        const [insertedLead] = await db
            .insert(leads)
            .values({
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                serviceType,
                description: description.trim(),
            })
            .returning({
                id: leads.id,
                createdAt: leads.createdAt,
            });

            if (!insertedLead) {
            throw new Error('Veritabanı kaydı oluşturulamadı.');
            }

            // 5. Arka Planda Resend Bildirimi
            c.executionCtx.waitUntil(
            sendLeadNotifications({
                apiKey: c.env.RESEND_API_KEY || '',
                leadId: insertedLead.id,
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                serviceType,
                description: description.trim(),
                adminEmail: c.env.ADMIN_EMAIL,
            })
            );

            // 6. Başarılı Yanıt (HTTP 201 Created)
            return c.json(
            {
                success: true,
                message: 'Talebiniz başarıyla kaydedildi ve onay e-postası iletildi.',
                recordId: insertedLead.id,
            },
            201
            );

    } catch (error: any) {
        console.error('Lead submission error:', error);
        return c.json(
        {
            success: false,
            message: 'Sunucu tarafında geçici bir hata oluştu. Lütfen tekrar deneyiniz.',
        },
        500
        );
    }
});

export default app;