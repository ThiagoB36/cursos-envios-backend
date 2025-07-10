import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, curso } = body;

  const primeiroLink = curso.links?.[0];

  if (!email || !primeiroLink) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const data = await resend.emails.send({
      from: "Seu Nome <noreply@cursosteste.com>",
      to: [email],
      subject: `Bem-vindo ao curso ${curso.nome}`,
      html: `
        <h1>Olá!</h1>
        <p>Você foi inscrito no curso <strong>${curso.nome}</strong>.</p>
        <p>Aqui está seu primeiro link de acesso:</p>
        <a href="${primeiroLink}" target="_blank">${primeiroLink}</a>
        <br/><br/>
        <small>Este é um envio automático.</small>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao enviar e-mail" },
      { status: 500 }
    );
  }
}
