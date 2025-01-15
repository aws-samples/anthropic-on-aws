import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { filename } = req.query;
  const documentsDir = path.join(process.cwd(), 'documents');
  const filePath = path.join(documentsDir, filename as string);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(404).json({ message: 'PDF file not found' });
  }
}