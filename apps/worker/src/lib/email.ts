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
}: SendNotificationParams) {
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY tanımlanmamış, e-posta bildirimi atlandı.');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    // 1. Kullanıcıya Onay / Alındı E-postası
    await resend.emails.send({
      from: `OpsPulse Systems <${adminEmail}>`,
      to: email,
      subject: `Talebiniz Alındı — OpsPulse Kayıt No: ${leadId.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 32px; border-radius: 8px;">
          <h2 style="color: #818cf8; margin-bottom: 16px;">OpsPulse Hizmet Talebiniz Kaydedildi</h2>
          <p>Merhaba <strong>${fullName}</strong>,</p>
          <p>Sistem talebiniz veritabanımıza başarıyla işlenmiştir. Mühendislik ekibimiz sistem gereksinimlerinizi inceleyerek 24 saat içinde bu e-posta adresi üzerinden dönüş sağlayacaktır.</p>
          
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
    });

    if (adminEmail) {
        await resend.emails.send({
            from: `OpsPulse Systems <no-reply@${adminEmail.split('@')[1]}>`, // Onaylı domaininden kullanıcıya gider
            to: email, // Formu dolduran adayın e-postası
            subject: `Talebiniz Alındı — OpsPulse Kayıt No: ${leadId.slice(0, 8)}`,
            html: `...`,
        });
    }
    else {
        await resend.emails.send({
            from: 'OpsPulse Systems <no-reply@onboard.dev>', // Onaylı domaininden kullanıcıya gider
            to: email, // Formu dolduran adayın e-postası
            subject: `Talebiniz Alındı — OpsPulse Kayıt No: ${leadId.slice(0, 8)}`,
            html: `...`,
        });
    }        
    // 2. Operasyon / Admin Bildirimi
    if (adminEmail) {
      await resend.emails.send({
        from: `OpsPulse Alert no-reply@${adminEmail.split('@')[1]}`,
        to: adminEmail,
        subject: `[Yeni Lead] ${serviceType} — ${fullName}`,
        text: `Yeni Talep Alındı:\nID: ${leadId}\nİsim: ${fullName}\nE-posta: ${email}\nHizmet: ${serviceType}\nDetay: ${description}`,
      });
    }
  } catch (err) {
    console.error('[Resend Error]:', err);
  }
}