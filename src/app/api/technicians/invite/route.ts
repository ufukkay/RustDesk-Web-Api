import { NextResponse } from "next/server";
import { createInvite } from "@/lib/invites";
import { getSettings } from "@/lib/settings";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-posta adresi gerekli" }, { status: 400 });
    }

    const settings = getSettings();
    const invite = createInvite(email, role || "Teknisyen");

    // Send Email
    if (settings.smtpHost && settings.smtpEmail) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort || "587"),
        secure: settings.smtpPort === "465",
        requireTLS: settings.smtpPort === "587",
        auth: {
          user: settings.smtpEmail,
          pass: settings.smtpPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const domain = settings.host || "rmm.talay.com";
      const inviteLink = `https://${domain}/invite?token=${invite.token}`;

      await transporter.sendMail({
        from: `"RustDesk RMM" <${settings.smtpEmail}>`,
        to: email,
        subject: "Sistem Yönetim Daveti - RustDesk RMM",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #FFCC00;">Davet Edildiniz!</h2>
            <p>RustDesk RMM yönetim portalına katılmanız için bir davet oluşturuldu.</p>
            <p>Hesabınızı kurmak ve giriş yapmak için aşağıdaki butona tıklayın:</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background: #FFCC00; color: #0E1116; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Hesabımı Kur</a>
            </div>
            <p style="font-size: 13px; color: #666;">Bu davet 24 saat geçerlidir. Eğer butona tıklayamıyorsanız şu linki kopyalayıp tarayıcınıza yapıştırın:</p>
            <p style="font-size: 11px; color: #888;">${inviteLink}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Invite API error:", error);
    return NextResponse.json({ error: error.message || "Davet gönderilemedi" }, { status: 500 });
  }
}
