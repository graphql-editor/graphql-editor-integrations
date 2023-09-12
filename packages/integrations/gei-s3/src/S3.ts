import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface S3ClientDetails {
  client: S3Client;
  bucket: string;
}

let s3: S3ClientDetails | undefined;

export function getEnv<T extends string>(val: T[]): Record<T, string> {
  const ret: Partial<Record<T, string>> = {};
  for (const k of val) {
    if (!(k in process.env)) {
      throw new Error(`${k} is required`);
    }
    ret[k] = process.env[k];
  }

  return ret as Record<T, string>;
}

const initializeS3Client = (): S3ClientDetails => {
  if (s3) return s3;

  const { SPACES_BUCKET, SPACES_REGION, SPACES_KEY, SPACES_SECRET } = getEnv([
    'SPACES_BUCKET',
    'SPACES_REGION',
    'SPACES_KEY',
    'SPACES_SECRET',
  ]);

  const endpoint = process.env.SPACES_ENDPOINT ? `https://${SPACES_REGION}.${process.env.SPACES_ENDPOINT}` : undefined;
  console.log(endpoint)
  s3 = {
    client: new S3Client({
      region: SPACES_REGION,
      credentials: {
        accessKeyId: SPACES_KEY,
        secretAccessKey: SPACES_SECRET
      },
      endpoint: endpoint
    }),
    bucket: SPACES_BUCKET
  };

  return s3;
};

export const putUrl = async ({
  fileKey,
  contentType,
}: {
  fileKey: string;
  contentType: string;
}): Promise<{ fileKey: string; putUrl: string }> => {
  const s3 = initializeS3Client();
  const command = new PutObjectCommand({
    Bucket: s3.bucket,
    Key: fileKey,
    ContentType: contentType,
    ACL: 'public-read',
  });
  
  const putUrl = await getSignedUrl(s3.client, command);

  return {
    fileKey,
    putUrl,
  };
};

export const getUrl = async (fileKey: string | undefined): Promise<string> => {
  if (!fileKey || fileKey === '') return '';
  if (fileKey.includes('https')) return fileKey;

  const s3 = initializeS3Client();
  const command = new GetObjectCommand({
    Bucket: s3.bucket,
    Key: fileKey
  });
  
  const getUrl = await getSignedUrl(s3.client, command);

  return getUrl;
};
