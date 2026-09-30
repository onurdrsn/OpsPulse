import { Resend } from 'resend';

interface SendNotificationParams {
  apiKey: string;
  leadId: string;
  fullName: string;
  email: string;
  serviceType: string;
  description: string;
  adminEmail?: string;
}

export async function sendLeadNotifications({
  apiKey,
  leadId,
  fullName,
  email,
  serviceType,
  description,
  adminEmail,
}: SendNotificationParams): Promise<void> {
  // 1. Guard Clause: Gerekli anahtar veya admin e-postası yoksa çık
  if (!apiKey || !adminEmail) {
    console.warn('[Resend] API anahtarı veya onaylı admin e-postası eksik, bildirimler atlandı.');
    return;
  }

  const resend = new Resend(apiKey);
  const senderAddress = `OpsPulse Systems <${adminEmail}>`;
  const shortId = leadId.slice(0, 8);

  try {
    // 2. İki e-postayı eşzamanlı (paralel) ilet
    await Promise.allSettled([
      // Adaya giden onay e-postası
      resend.emails.send({
        from: senderAddress,
        to: email,
        subject: `Talebiniz Alındı — OpsPulse Kayıt No: ${shortId}`,
        html: `
          <div style="font-family: sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 32px; border-radius: 8px;">
            <h2 style="color: #818cf8; margin-bottom: 16px;">OpsPulse Hizmet Talebiniz Kaydedildi</h2>
            <p>Merhaba <strong>${fullName}</strong>,</p>
            <p>Sistem talebiniz veritabanımıza başarıyla işlenmiştir. Mühendislik ekibimiz gereksinimlerinizi inceleyerek 24 saat içinde bu e-posta adresi üzerinden dönüş sağlayacaktır.</p>
            
            <div style="background-color: #1e293b; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Talep Referansı:</strong> ${leadId}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Seçilen Hizmet:</strong> ${serviceType}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Özet Açıklama:</strong> ${description}</p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 16px;">
              Bu e-posta OpsPulse teknik değerlendirme demosu kapsamında otomatik olarak iletilmiştir.
            </p>
          </div>
        `,
      }),

      // Operasyon ekibine giden bildirim (replyTo ile doğrudan adaya yanıtlanabilir)
      resend.emails.send({
        from: senderAddress,
        to: adminEmail,
        replyTo: email,
        subject: `[Yeni Lead] ${serviceType} — ${fullName}`,
        text: `Yeni Talep Alındı:\n\nID: ${leadId}\nİsim: ${fullName}\nE-posta: ${email}\nHizmet: ${serviceType}\n\nDetay:\n${description}`,
      }),
    ]);
  } catch (err) {
    console.error('[Resend Error]:', err);
  }
}
