import { NextRequest } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        {
          error:
            'OPENROUTER_API_KEY is missing. Add it to .env.local',
        },
        { status: 500 }
      );
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      return Response.json(
        {
          error: errorText || 'OpenRouter API error',
        },
        { status: response.status }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            const lines = chunk
              .split('\n')
              .filter((line) => line.startsWith('data: '));

            for (const line of lines) {
              const data = line.replace('data: ', '').trim();

              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const text =
                  parsed.choices?.[0]?.delta?.content || '';

                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch {
                // ignore malformed chunk
              }
            }
          }

          controller.close();
        } catch (err) {
          console.error(err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}