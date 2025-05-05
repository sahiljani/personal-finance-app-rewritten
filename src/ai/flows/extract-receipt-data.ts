
'use server';

/**
 * @fileOverview Extracts receipt items from an image or PDF file using the Gemini API and suggests a category for each item.
 *
 * - extractReceiptData - A function that handles the receipt extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type { Category } from '@/lib/types';
import { getCategories } from '@/lib/actions'; // Fetch categories to validate against

// Category IDs should be fetched dynamically or kept in sync with categories.json
// For simplicity, hardcoding the expected IDs for the prompt instructions.
// In a production app, fetching these dynamically might be better.
const VALID_CATEGORY_IDS = [
  "outside-food", "grocery", "transportation", "housing", "utilities",
  "entertainment", "shopping", "clothing", "electronics", "books",
  "tools", "health", "other"
];

const ExtractReceiptDataInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A receipt image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

// Make sure the output schema includes categoryId
const ReceiptItemSchema = z.object({
    description: z.string().describe('The description of the item.'),
    amount: z.number().describe('The amount of the item.'),
    categoryId: z.string().describe(`The suggested category ID for the item. Must be one of ${VALID_CATEGORY_IDS.join(', ')}.`),
  });

const ExtractReceiptDataOutputSchema = z.array(ReceiptItemSchema)
  .describe('An array of receipt items, each with a description, amount, and suggested category ID.');

// This type should be equivalent to (ReceiptItem & { categoryId: string })[]
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;


// This function is the public interface for this flow
export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
    // Fetch current categories to validate against LLM output
    const categories = await getCategories();
    const validCategoryIds = categories.map(c => c.id);
    const defaultCategoryId = categories.find(c => c.id === 'other')?.id || validCategoryIds[0] || ''; // Fallback

    const result = await extractReceiptDataFlow(input);

    // Validate and potentially correct the category IDs returned by the AI
    const validatedResult = result.map(item => ({
        ...item,
        categoryId: validCategoryIds.includes(item.categoryId) ? item.categoryId : defaultCategoryId
    }));

    return validatedResult;
}

// Define the prompt for the AI
const extractPrompt = ai.definePrompt({
    name: 'extractReceiptDataPrompt',
    input: {
        schema: ExtractReceiptDataInputSchema
    },
    output: {
        schema: ExtractReceiptDataOutputSchema // Expect an array of items with categoryId
    },
    prompt: `Analyze the provided receipt image or PDF. Extract each line item, including its description and amount.

For each item, suggest the most appropriate category ID based on the following rules and available categories.

Available Category IDs: ${VALID_CATEGORY_IDS.join(', ')}

Category Rules:
1. If the item comes from a grocery store or is a raw food ingredient (e.g., milk, eggs, flour, vegetables, meat), assign category ID: "grocery".
2. If the item is prepared food or drink from a restaurant, café, fast food, delivery service, etc. (e.g., pizza, latte, sandwich, meal combo), assign category ID: "outside-food".
3. For items like clothing, shoes, accessories, assign category ID: "clothing".
4. For items like computers, phones, TVs, gadgets, assign category ID: "electronics".
5. For books, magazines, newspapers, assign category ID: "books".
6. For hardware, tools, home improvement items, assign category ID: "tools".
7. For general merchandise not fitting other specific categories, assign category ID: "shopping".
8. If none of the above fit well, assign category ID: "other".

Receipt Content: {{media url=fileDataUri}}

Return the results as a JSON array, where each object has "description", "amount", and "categoryId" fields. Ensure the "categoryId" strictly matches one of the available IDs listed above.
`,
});


// This defines the Genkit flow
const extractReceiptDataFlow = ai.defineFlow<
  typeof ExtractReceiptDataInputSchema,
  typeof ExtractReceiptDataOutputSchema
>(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async (input): Promise<ExtractReceiptDataOutput> => {
    // Directly call the prompt with the input data URI
    const llmResponse = await extractPrompt(input);
    const output = llmResponse.output;

    if (!output) {
      throw new Error("AI failed to return structured output for receipt extraction.");
    }

    // Optional: Add more robust error handling or validation if needed
    // The flow's outputSchema provides basic validation.

    return output;
  }
);
