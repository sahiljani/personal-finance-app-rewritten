
'use server';

/**
 * @fileOverview Extracts receipt items from an image or PDF file using the Gemini API.
 *
 * - extractReceiptData - A function that handles the receipt extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
// Import the actual service function, not the type definition again
import { extractReceiptItems } from '@/services/gemini';
// Import the type definition if needed elsewhere, but not for the function call itself
import type { ReceiptItem } from '@/services/gemini';

const ExtractReceiptDataInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A receipt image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

// Make sure the output schema matches the ReceiptItem interface from gemini.ts
const ExtractReceiptDataOutputSchema = z.array(z.object({
    description: z.string().describe('The description of the item.'),
    amount: z.number().describe('The amount of the item.'),
  })).describe('An array of receipt items, each with a description and amount.');
// This type should be equivalent to ReceiptItem[]
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;


// This function is the public interface for this flow
export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

// This defines the Genkit flow
const extractReceiptDataFlow = ai.defineFlow<
  typeof ExtractReceiptDataInputSchema,
  typeof ExtractReceiptDataOutputSchema // Use the Zod schema here
>(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema, // And here
  },
  async (input): Promise<ExtractReceiptDataOutput> => { // Ensure return type matches Zod schema output
    // Convert the data URI to a File object
    const dataUri = input.fileDataUri;
    const matches = dataUri.match(/^data:(.+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid data URI format.");
    }
    const mimeString = matches[1];
    const base64String = matches[2];

    // Check if running in a browser environment before using atob
     let byteString: string;
     if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        byteString = window.atob(base64String);
     } else if (typeof Buffer !== 'undefined') {
        // Node.js environment
        byteString = Buffer.from(base64String, 'base64').toString('binary');
     } else {
         throw new Error("Cannot decode base64 string: unsupported environment.");
     }


    // Convert binary string to a Uint8Array
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

     // Check if Blob and File are available (browser environment)
     if (typeof Blob === 'undefined' || typeof File === 'undefined') {
         throw new Error("Blob or File API not available in this environment.");
     }

    // Create a Blob from the Uint8Array
    const blob = new Blob([uint8Array], {type: mimeString});

    // Create a File from the Blob - Provide a default name
    const file = new File([blob], 'receipt_upload', {type: mimeString});

    // Call the Gemini service (placeholder or actual implementation)
    // The return type of extractReceiptItems *must* match ExtractReceiptDataOutput (i.e., ReceiptItem[])
    const receiptItems: ReceiptItem[] = await extractReceiptItems(file);

    // No validation needed here if extractReceiptItems already returns the correct type
    // and the outputSchema matches. Genkit handles the final output validation.
    return receiptItems;
  }
);
