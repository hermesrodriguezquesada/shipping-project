import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/core/config/config.service';
import {
  RemittancePaymentProofObjectUploadRequest,
  RemittancePaymentProofStoragePort,
  RemittancePaymentProofUploadRequest,
  RemittancePaymentProofViewRequest,
} from '../../domain/ports/remittance-payment-proof-storage.port';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3RemittancePaymentProofStorageAdapter implements RemittancePaymentProofStoragePort {
  constructor(private readonly config: AppConfigService) {}

  async createPresignedUploadUrl(input: RemittancePaymentProofUploadRequest): Promise<string> {
    const { bucket, client } = this.resolveAwsClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      ContentType: input.mimeType,
    });

    return getSignedUrl(client, command, { expiresIn: input.expiresInSeconds });
  }

  async createPresignedViewUrl(input: RemittancePaymentProofViewRequest): Promise<string> {
    const { bucket, client } = this.resolveAwsClient();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: input.key,
    });

    return getSignedUrl(client, command, { expiresIn: input.expiresInSeconds });
  }

  async uploadObject(input: RemittancePaymentProofObjectUploadRequest): Promise<void> {
    const { bucket, client } = this.resolveAwsClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        ContentType: input.mimeType,
        Body: input.body,
      }),
    );
  }

  async exists(input: { key: string }): Promise<boolean> {
    const { bucket, client } = this.resolveAwsClient();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: input.key,
        }),
      );

      return true;
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotFound' || name === 'NoSuchKey') {
        return false;
      }

      throw error;
    }
  }

  private resolveAwsClient(): { bucket: string; client: S3Client } {
    const bucket = this.requireValue(this.config.awsS3BucketName, 'AWS_S3_BUCKET_NAME');
    const region = this.requireValue(this.config.awsRegion, 'AWS_REGION');
    const accessKeyId = this.requireValue(this.config.awsAccessKeyId, 'AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.requireValue(this.config.awsSecretAccessKey, 'AWS_SECRET_ACCESS_KEY');

    return {
      bucket,
      client: new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    };
  }

  private requireValue(value: string | undefined, key: string): string {
    if (!value?.trim()) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
