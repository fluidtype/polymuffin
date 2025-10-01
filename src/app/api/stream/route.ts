export const runtime = 'edge';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let i = 0;
      const t = setInterval(() => {
        const payload = JSON.stringify({ t: Date.now(), value: 50 + Math.sin(i / 5) * 10 + Math.random() * 2 });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        i++;
      }, 1500);
      return () => clearInterval(t);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
