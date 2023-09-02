import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

type ResponseData = {
  text: string;
}

interface GenerateNextApiRequest extends NextApiRequest {
  body: {
    prompt: string
  }
}

const configuration = new Configuration({

  apiKey: process.env.OPENAI_API_KEY,

});
const openai = new OpenAIApi(configuration);

export default async function handler(
  req: GenerateNextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const prompt = req.body.prompt;

  if (!prompt || prompt === '') {
    return res.status(400).json({ text: "Please send your prompt" });
  }

  try {
    const aiResult = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // change to 'gpt-4' if you have access to it
      temperature: 0.8,
      n: 1,
      max_tokens: 2000,
      stream: false,
      messages: [
        {
          role: "system",
          content: `Pretend you are a project manager giving an overview of around 500 words discussing what was completed in tasks and how work has been going for the past week. You should mention who worked on what and which tasks are still in progress or pending for the next week.It should sound somethign like: For the past week of 7/24/2023, we saw 50% progress on  Reskin Building and 25% progress on job South Building. Las Vegas Civic Plaza is done.....`
        },
        {
          role: "user",
          content: `Use the following task data: ${JSON.stringify(
            prompt
          )}`,
        },
      ],
    })


    const response = aiResult.data?.choices?.[0]?.message;
    if ("content" in response) {
      console.log("response", response.content)
      return res.status(200).json({ text: response.content });
    } else {
      return res.status(200).json({ text: "nada colada" });
    }
  } catch (error) {
    return res.status(500).json({ text: "Internal server error" });
  }
}