import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/** Cloudflare R2 (S3 compatível). Guarda os PDFs publicados. */
function cliente() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

/** Envia o PDF e devolve a URL pública. */
export async function enviarPdf(chave: string, dados: Uint8Array): Promise<string | null> {
  const s3 = cliente();
  const bucket = process.env.R2_BUCKET;
  const publico = process.env.R2_PUBLIC_URL;
  if (!s3 || !bucket || !publico) return null;
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: chave, Body: dados, ContentType: "application/pdf" }),
  );
  return `${publico.replace(/\/$/, "")}/${chave}`;
}
