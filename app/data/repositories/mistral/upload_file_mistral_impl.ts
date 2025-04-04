import { UploadRepository } from '#domain/contracts/repositories/upload_repository'
import drive from '@adonisjs/drive/services/main'
import { GetFileListItemDto } from '#data/types/fetch_item_interface'
import env from '#start/env'
import { extractUploadItems } from '#data/utils/extract_files'
import { Mistral } from '@mistralai/mistralai'
import { ContentChunk } from '@mistralai/mistralai/models/components/index.js'
import { extractJsonFromText } from '#data/utils/extract_json'
export class UploadFileToMistralImpl implements UploadRepository {
  async uploadFile(file: any): Promise<string | Array<ContentChunk> | null | undefined> {
    const fileName = file.clientName
    let chatResponse
    try {
      await file.moveToDisk(fileName)
      await drive.use().getUrl(fileName)

      const mcqPrompt = `
I have a PDF containing multiple-choice questions (MCQs). Each MCQ consists of:
- A **question**
- Multiple **answer choices** (A, B, C, D, etc.)
- One or more **correct answers**
- (Optional) An **explanation** for the correct answer

**Objective:**
Extract **all the text from the PDF** and organize the MCQs into a **structured JSON format**.

**Expected JSON format:**
\`\`\`json
[
  {
    "id": 1,
    "question": "What is the capital of France?",
    "choices": {
      "A": "Berlin",
      "B": "Madrid",
      "C": "Paris",
      "D": "Rome"
    },
    "correct_answers": ["C"],
    "explanation": "Paris is the capital of France."
  },
  {
    "id": 2,
    "question": "Which is the largest ocean in the world?",
    "choices": {
      "A": "Atlantic Ocean",
      "B": "Indian Ocean",
      "C": "Arctic Ocean",
      "D": "Pacific Ocean"
    },
    "correct_answers": ["D"],
    "explanation": "The Pacific Ocean is the largest ocean in the world."
  }
]
\`\`\`

**Structuring Guidelines:**
- Identify each MCQ and assign a **unique id**.
- Preserve **all answer choices** under \`"choices"\`.
- Place the **correct answers** inside \`"correct_answers"\` as an array (one or more).
- If an **explanation** is available, include it under \`"explanation"\`, otherwise leave it as an empty string (\`\`\`).

**Additional Notes:**
- The text in the PDF may contain numbering, unnecessary spaces, or line breaks. Clean these elements to ensure a well-formatted structure.
- Ensure that the generated JSON files are **valid and well-structured**.
- **If the correct answer is not explicitly mentioned, try to deduce it and insert it into the corresponding "correct_answers" field.**
- **If the PDF only contains correct answers**, you must generate **incorrect answer choices** that logically fit, ensuring the answer choices are valid and assist in learning. The "choices" should contain plausible distractors to make the multiple-choice question effective for studying.
- **Sometimes the correct answer might be highlighted in a different color or made bold. Be sure to recognize it based on formatting cues like bold text or color and assign it as the correct answer.**

**Expected Output:**
Provide a **JSON file** containing all the extracted MCQs in the specified format.
`

      const apiKey = env.get('MISTRAL_API_KEY')

      const client = new Mistral({
        apiKey: apiKey,
      })

      chatResponse = await client.chat.complete({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: mcqPrompt,
              },
              {
                type: 'document_url',
                documentUrl: `https://ascocoli-cdn.uvatis.com/${fileName}`,
              },
            ],
          },
        ],
      })

      const jsonText = chatResponse.choices?.[0]?.message?.content
        ? extractJsonFromText(chatResponse.choices[0].message.content as string)
        : null
      console.log(jsonText)
      if (jsonText) {
        chatResponse = JSON.parse(jsonText)
      } else {
        throw new Error('No valid JSON found in AI response')
      }
    } catch (e) {
      console.error('Erreur lors du scan du fichier :', e)
    }

    return chatResponse
  }

  async getFileList(): Promise<GetFileListItemDto[]> {
    try {
      const accountId = env.get('ACCOUNT_ID')
      const bucketName = env.get('R2_BUCKET')
      const token = env.get('CLOUDFLARE_TOKEN')

      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur Cloudflare: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      const bucketUrl = 'https://ascocoli-cdn.uvatis.com'
      return extractUploadItems(data, bucketUrl)
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers :', error)
      throw new Error(`Erreur Cloudflare: ${error.status} - ${error.statusText}`)
    }
  }
}
