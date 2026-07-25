export async function chat(messages: {
  role: "user" | "assistant" | "system";
  content: string;
}[]) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error("Failed to chat");
  }

  return response.json();
}