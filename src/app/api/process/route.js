export async function POST(request) {
  try {
    const { key, filename } = await request.json();

    if (!key) {
      return Response.json({ error: "key required" }, { status: 400 });
    }

const videoUrl = `https://pub-87a78bbe5e4d41f2a712d51dbf833383.r2.dev/${key}`;    // Trigger Modal processing
    const modalResponse = await fetch(process.env.MODAL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        video_url: videoUrl,
        filename: filename || key.split('/').pop()
      }),
    });

    if (!modalResponse.ok) {
      throw new Error(`Modal trigger failed: ${modalResponse.status}`);
    }

    return Response.json({ success: true, message: "Processing started" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
