import { collection, updateDoc, doc, Timestamp } from "firebase/firestore";
import { getFirestore, getDocs } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const resend = new Resend(process.env.RESEND_API_KEY);

// Helpers
function formatDate(date: Date): string {
  return date
    .toLocaleDateString("pt-BR", { timeZone: "UTC" })
    .split("/")
    .map((part) => part.padStart(2, "0"))
    .join("/");
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

export async function GET() {
  try {
    const today = formatDate(new Date());

    // 1. Buscar cursos
    const cursosSnap = await getDocs(collection(db, "cursos"));
    const cursosMap = new Map<string, { nome: string; links: string[] }>();

    cursosSnap.forEach((curso) => {
      const data = curso.data();
      cursosMap.set(data.nome, {
        nome: data.nome,
        links: data.links ?? [],
      });
    });

    // 2. Buscar alunos
    const snapshot = await getDocs(collection(db, "studants"));
    let enviados = 0;
    console.log({ snapshot });
    for (const document of snapshot.docs) {
      const data = document.data();
      const { email, nextSend, curso, active } = data;
      const teste = cursosMap.has(curso.nome);
      console.log({ data, teste });

      if (nextSend === today && email && active && cursosMap.has(curso.nome)) {
        console.log("dentro do if");
        const cursoData = cursosMap.get(curso.nome)!;

        const htmlBody = `
            <h1>Olá!</h1>
            <p>Hoje é dia de continuar seus estudos no curso <strong>${cursoData.nome}</strong>.</p>
            <p>Links das matérias:</p>
            ${cursoData.links
              .map((link: string, i: number) => {
                if (i > data.lastLink && i <= data.lastLink + 5) {
                  return `<p><strong>Matéria ${i + 1}:</strong> <a href="${link}" target="_blank">${link}</a></p>`;
                }
                return "";
              })
              .join("")}
            <br/>
            <small>Este é um envio automático.</small>
          `;

        await resend.emails.send({
          from: `${cursoData.nome} <onboarding@resend.dev>`,
          to: [email],
          subject: `Seu conteúdo do curso ${cursoData.nome}`,
          html: htmlBody,
        });

        // Atualiza nextSend e lastLink
        const novoNextSend = formatDate(addDays(new Date(), 30));
        const novoLastLink = data.lastLink + cursoData.links.length;

        await updateDoc(doc(db, "studants", document.id), {
          nextSend: novoNextSend,
          lastLink: novoLastLink,
        });

        enviados++;
      }
      await updateDoc(doc(db, "studants", document.id), {
        lastVerification: new Date(),
      });
    }

    return NextResponse.json({ success: true, enviados });
  } catch (error) {
    console.error("Erro ao processar envios:", error);
    return NextResponse.json(
      { error: "Erro ao processar envios." },
      { status: 500 }
    );
  }
}
