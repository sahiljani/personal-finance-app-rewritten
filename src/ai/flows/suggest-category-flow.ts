
'use server';
/**
 * @fileOverview Suggests an expense category based on the item description using Genkit and Gemini.
 *
 * - suggestCategoryFlow - A Genkit flow that takes a description and category list, returns suggested category ID.
 * - SuggestCategoryInput - Input type for the flow.
 * - SuggestCategoryOutput - Output type for the flow.
 * - suggestCategory - Wrapper function to call the flow.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import type { Category } from '@/lib/types'; // Use existing Category type if needed

// Schema for the list of available categories passed to the prompt
const CategoryInfoSchema = z.object({
    id: z.string(),
    name: z.string(),
});

const SuggestCategoryInputSchema = z.object({
  description: z
    .string()
    .min(1, "Description cannot be empty.")
    .describe('The description of the expense item.'),
  categories: z.array(CategoryInfoSchema).describe('List of available categories with their IDs and names.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  categoryId: z.string().nullable().describe('The suggested category ID for the item, or null if no specific suggestion.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

// Exported wrapper function for easy use in server actions
export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
    return suggestCategoryFlow(input);
}


const suggestCategoryPrompt = ai.definePrompt({
    name: 'suggestCategoryPrompt',
    input: {
        schema: SuggestCategoryInputSchema,
    },
    output: {
        schema: SuggestCategoryOutputSchema,
    },
    prompt: `Given the expense item description and a list of available categories, suggest the single most appropriate category ID.

Available Categories:
{{#each categories}}
- ID: {{id}}, Name: {{name}}
{{/each}}

Expense Description: {{{description}}}

Category Rules:
1. If the item comes from a grocery store or is a raw food ingredient (e.g., milk, eggs, flour, vegetables, meat), strongly prefer category ID: "grocery".
2. If the item is prepared food or drink from a restaurant, café, fast food, delivery service, etc. (e.g., pizza, latte, sandwich, meal combo, "varsha naan and curry"), strongly prefer category ID: "outside-food".
3. For items like clothing, shoes, accessories, prefer "clothing".
4. For items like computers, phones, TVs, gadgets, prefer "electronics".
5. For books, magazines, newspapers, prefer "books".
6. For hardware, tools, home improvement items, prefer "tools".
7. For general merchandise not fitting other specific categories (like from Walmart, Target, Amazon), prefer "shopping".
8. For medical expenses, pharmacy items, doctor visits, prefer "health".
9. For transportation costs like gas, taxi, bus fare, prefer "transportation".
10. For housing costs like rent or mortgage, prefer "housing".
11. For utility bills like electricity, water, internet, prefer "utilities".
12. For entertainment like movies, concerts, games, prefer "entertainment".
13. If none of the above fit well or the description is ambiguous, return the ID for "other". If "other" is not available, return null.

Analyze the description: "{{description}}". Based on the rules and available categories, return ONLY the suggested category ID in the 'categoryId' field. If no specific category fits well, use the ID for "other". If "other" category doesn't exist, return null.
`,
});

// Define the Genkit flow
export const suggestCategoryFlow = ai.defineFlow<
  typeof SuggestCategoryInputSchema,
  typeof SuggestCategoryOutputSchema
>(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input): Promise<SuggestCategoryOutput> => {
    try {
        const {output} = await suggestCategoryPrompt(input);

        // Basic validation: ensure output exists and categoryId is a string or null
        if (!output || typeof output.categoryId === 'undefined') {
             console.error("AI failed to return structured output for category suggestion.");
            return { categoryId: null }; // Return null on failure
        }

        // Further validation: check if the returned categoryId actually exists in the provided list,
        // or if it's explicitly null. Allow 'other' even if it's not strictly in the list if the AI suggests it as fallback.
        const isValidSuggestion = output.categoryId === null || input.categories.some(c => c.id === output.categoryId);
         const isOtherCategory = output.categoryId === (input.categories.find(c => c.name.toLowerCase() === 'other')?.id || 'other'); // Check if suggested ID is 'other'

        if (isValidSuggestion || isOtherCategory) {
            return output;
        } else {
            console.warn(`Suggested categoryId "${output.categoryId}" is not in the provided list. Falling back to 'other' or null.`);
             const otherCategoryId = input.categories.find(c => c.id === 'other')?.id;
            return { categoryId: otherCategoryId || null }; // Fallback to 'other' ID if available, else null
        }

    } catch (error) {
        console.error("Error executing suggestCategoryFlow:", error);
        // Return null in case of flow execution error
        return { categoryId: null };
    }
  }
);
