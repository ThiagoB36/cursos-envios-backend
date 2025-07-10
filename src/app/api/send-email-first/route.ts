import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Handler para requisições POST (envio do e-mail)
export async function POST(req: Request) {
  const body = await req.json();
  const { email, curso } = body;
  console.log({ body });
  const primeiroLink = curso.links?.[0];

  if (!email || !primeiroLink) {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  try {
    console.log("dentro do try");
    const data = await resend.emails.send({
      from: "Seu Nome <onboarding@resend.dev>",
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
    console.log({ data });

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Erro ao enviar e-mail" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}

// ✅ Handler para requisições OPTIONS (pré-flight CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
