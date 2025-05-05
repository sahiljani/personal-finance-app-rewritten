
/**
 * Represents an item extracted from a receipt, including its description, amount, and suggested category.
 */
export interface ReceiptItem {
  /**
   * The description of the item.
   */
  description: string;
  /**
   * The amount of the item.
   */
  amount: number;
  /**
   * The suggested category ID for the item.
   */
  categoryId: string;
}

/**
 * Asynchronously extracts receipt items from an image or PDF file using the Gemini API.
 *
 * IMPORTANT: This is a placeholder. The actual implementation requires calling the
 * Genkit flow `extractReceiptData` (defined in `src/ai/flows/extract-receipt-data.ts`)
 * or directly interfacing with the Gemini API if the flow isn't used.
 * For this example, we return mock data. The AI flow should be used in a real scenario.
 *
 * @param file The image or PDF file to process.
 * @returns A promise that resolves to an array of ReceiptItem objects.
 */
export async function extractReceiptItems(file: File): Promise<ReceiptItem[]> {
  console.warn(
    "Using mock data for extractReceiptItems. Implement actual Gemini API call.",
    file.name, file.type // Log file info for context
    );

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

   // Simulate potential errors
    // if (Math.random() < 0.1) { // 10% chance of error
    //   throw new Error("Simulated Gemini API error.");
    // }


  // Return mock data matching the expected structure including categoryId
  return [
    {
      description: 'Iced Latte',
      amount: 4.75,
      categoryId: 'outside-food', // Example category
    },
    {
      description: 'Croissant',
      amount: 3.25,
      categoryId: 'outside-food', // Example category
    },
     {
      description: 'Bagel w/ Cream Cheese',
      amount: 4.50,
      categoryId: 'outside-food', // Example category
    },
     {
        description: 'Bottled Water',
        amount: 2.00,
        categoryId: 'grocery', // Example category
     }
  ];
}

