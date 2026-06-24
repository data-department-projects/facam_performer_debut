import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3_SIGNED_URL_EXPIRY_SECONDS } from "@/lib/constants";

let _s3: S3Client | null = null;

// Singleton lazy — évite un crash au chargement du module si AWS_REGION est absent (build, tests)
function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

function getBucket(): string {
  return process.env.AWS_S3_BUCKET_NAME!;
}

export async function uploadAttachment(
  key: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<string> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getAttachmentUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn: S3_SIGNED_URL_EXPIRY_SECONDS });
}

export function buildAttachmentKey(
  projectId: string,
  taskId: string,
  fileName: string,
): string {
  return `attachments/${projectId}/${taskId}/${fileName}`;
}

export function buildGanttImportKey(
  projectId: string,
  fileName: string,
): string {
  return `gantt-imports/${projectId}/${fileName}`;
}

export function buildKeyResultKey(
  keyResultId: string,
  fileName: string,
): string {
  return `key-results/${keyResultId}/${fileName}`;
}

export async function deleteAttachments(s3Keys: string[]): Promise<void> {
  if (s3Keys.length === 0) return;
  await getS3Client().send(
    new DeleteObjectsCommand({
      Bucket: getBucket(),
      Delete: { Objects: s3Keys.map((Key) => ({ Key })) },
    }),
  );
}
