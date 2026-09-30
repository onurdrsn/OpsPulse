import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { leads } from './db/schema';
import { createDb } from './db';

type Bindings = {
    DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', cors({
    origin: '*',
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type']
}));

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
        const body = await c.req.json();

        // 1. Zod ile sunucu tarafı sıkı doğrulama
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

        //2. Drizzle DB Bağlantısı
        const db = createDb(c.env.DATABASE_URL);

        // 3. Bot koruması
        if (body.website && body.website.trim() !== '') {
          // Bot yakalandı: sessizce başarılı mesajı döndür.
          return c.json({ success: true, message: 'Talebiniz alındı.' }, 201);
        }

        // 3. Tip güvenli insert ve returning
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

            return c.json(
            {
                success: true,
                message: 'Talebiniz başarıyla sunucuya kaydedildi. Ekibimiz en kısa sürede iletişime geçecektir.',
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