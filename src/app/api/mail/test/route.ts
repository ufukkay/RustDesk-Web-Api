import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { smtpHost, smtpPort, smtpEmail, smtpPassword } = await req.json();

    if (!smtpHost || !smtpPort || !smtpEmail || !smtpPassword) {
      return NextResponse.json({ error: "Eksik SMTP bilgileri" }, { status: 400 });
    }

    console.log("Starting mail test with:", { smtpHost, smtpPort, smtpEmail });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === "465",
      requireTLS: smtpPort === "587",
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log("Transporter verified");

    const info = await transporter.sendMail({
      from: smtpEmail,
      to: smtpEmail,
      subject: "RustDesk RMM Test Maili",
      text: "Bu bir test e-postasıdır. SMTP ayarlarınız başarıyla yapılandırıldı.",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FFCC00;">RustDesk RMM</h2>
          <p>Bu bir test e-postasıdır. SMTP ayarlarınız başarıyla yapılandırıldı.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Bu mail sistem ayarları sayfasından gönderilmiştir.</p>
        </div>
      `,
    });

    console.log("Mail sent successfully:", info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Mail test error details:", error);
    return NextResponse.json({ 
      error: error.message || "Mail gönderimi sırasında hata oluştu",
      details: error.stack
    }, { status: 500 });
  }
}
