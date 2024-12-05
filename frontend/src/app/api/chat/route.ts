import {
  AIStream,
  AIStreamCallbacksAndOptions,
  AIStreamParser,
  StreamingTextResponse,
  LangChainAdapter,
} from "ai";

export const dynamic = "force-dynamic";

function parseLangServeStream(): AIStreamParser {
  return (data) => {
    const json = JSON.parse(data) as { responses: string[] }; 
    return json.responses.join("\n");
  };
}

export function LangServeStream(
  res: Response,
  cb?: AIStreamCallbacksAndOptions,
): ReadableStream {
  console.log("[route.ts][LangServeStream] received response:", res);
  const stream = AIStream(res, parseLangServeStream(), cb); // Create a ReadableStream from the response directly
  return stream;
}

export async function POST(req: Request) {
  const rawBody = await req.text(); // Get raw body for logging
  // console.log("[route.ts][POST][received request body]", rawBody);

  const { input, config } = JSON.parse(rawBody); // Parse JSON from raw body
  // console.log("[route.ts][POST][input]", input);
  // console.log("[route.ts][POST][config]", config);

  if (input.config?.configurable?.task_type) {
    console.log("[route.ts][POST] task_type found, skipping message length check.");
  } else {
    if (!Array.isArray(input.messages) || input.messages.length === 0) {
      console.warn("[route.ts][POST] no messages found in the request.");
      return new Response("[route.ts][POST] no messages", { status: 400 });
    }
  }

  const lastMessage = input.messages[input.messages.length - 1]; // get last messsage
  // console.log("[route.ts][POST][last message]", lastMessage);

  // Extract thread_id directly from the config
  const threadId = config.configurable.thread_id;
  console.log("[route.ts][POST] extracted thread_id:", threadId); // Log the extracted thread_id
  const task_type = config.configurable.task_type;

  // build payload for llm
  const postData = {
    input: lastMessage,
    config: {
      configurable: {
        thread_id: threadId, // Use the extracted thread_id
        task_type: task_type,
      },
    },
    kwargs: {},
  };
  console.log("[route.ts][POST] sending POST request with payload:", JSON.stringify(postData));

  // send payload to llm api
  const fetchResponse = await fetch("http://localhost:8080/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  // console.log("[route.ts][POST][fetchResponse]", fetchResponse);

  if (!fetchResponse.ok) {
    console.error("[route.ts][POST][error] in fetch response:", await fetchResponse.text());
    return new Response("[route.ts][POST][error] fetching response", { status: 500 });
  }

  if (!fetchResponse.body) {
    console.error("[route.ts][POST][error] response body is not streamable.");
    return new Response("Invalid response format", { status: 500 });
  }

  // Create ReadableStream from response
  const stream = new ReadableStream({
    start(controller) {
      const reader = fetchResponse.body?.getReader();
      const decoder = new TextDecoder();

      function push() {
        reader?.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          const text = decoder.decode(value, { stream: true });
          console.log("[route.ts][POST] stream received value:\n", text);
          controller.enqueue(text); // Enqueue the decoded chunk
          push(); // Continue reading
        }).catch(error => {
          console.error("[route.ts][POST] error reading stream:\n", error);
          controller.error(error);
        });
      }

      // Start reading
      push();
    }
  });

  // Use LangChainAdapter to convert stream
  const anthropicStream = LangChainAdapter.toAIStream(stream);

  // Return StreamingTextResponse created from anthropicStream
  return new StreamingTextResponse(anthropicStream);
}