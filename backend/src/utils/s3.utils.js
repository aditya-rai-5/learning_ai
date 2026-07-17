import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret',
    },
});

export const generateSignedUrl = async (fileUrl) => {
    // Check if the URL is an S3 URL
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.includes('amazonaws.com')) {
        return fileUrl;
    }

    try {
        const urlObj = new URL(fileUrl);
        const hostParts = urlObj.hostname.split('.');
        let bucketName;
        let key = urlObj.pathname.substring(1); // remove leading slash

        if (hostParts.length >= 4 && hostParts[1] === 's3') {
            // Virtual-hosted-style: bucket.s3.region.amazonaws.com
            bucketName = hostParts[0];
        } else if (hostParts[0] === 's3' && urlObj.pathname.split('/').length > 2) {
            // Path-style: s3.region.amazonaws.com/bucket/key
            const pathParts = urlObj.pathname.split('/');
            bucketName = pathParts[1];
            key = pathParts.slice(2).join('/');
        } else {
            // Cannot parse, return original
            return fileUrl;
        }

        // URL decoding the key because s3 keys in URLs are usually URI encoded
        key = decodeURIComponent(key);

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        // 1 hour expiry
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return fileUrl; // Fallback to original url
    }
};

export const signModuleBody = async (module) => {
    if (!module || !module.body || module.contentType !== 'VIDEO') return module;

    try {
        let bodyObj = null;
        try {
            bodyObj = JSON.parse(module.body);
        } catch (e) {
            // Not a JSON object, maybe just a raw URL string
            if (module.body.includes('amazonaws.com')) {
                module.body = await generateSignedUrl(module.body);
            }
            return module;
        }

        if (bodyObj.url && bodyObj.url.includes('amazonaws.com')) {
            bodyObj.url = await generateSignedUrl(bodyObj.url);
            module.body = JSON.stringify(bodyObj);
        }
        return module;
    } catch (e) {
        console.error("Failed to sign module body", e);
        return module;
    }
};
