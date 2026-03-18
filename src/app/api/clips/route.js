export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=100`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Airtable error: ${response.status} — ${errText}`);
    }

    const data = await response.json();

    const clips = data.records.map((record) => {
      const f = record.fields;
      return {
        id: record.id,
        title: f.TITLE || f.Title || f.title || 'Untitled',
        bin: ((f.BIN || f.Bin || f.bin || 'broll')).toLowerCase(),
        tags: f.TAGS || f.Tags || f.tags
          ? typeof (f.TAGS || f.Tags || f.tags) === 'string'
            ? (f.TAGS || f.Tags || f.tags).split(',').map(t => t.trim())
            : (f.TAGS || f.Tags || f.tags)
          : [],
        score: f.SCORE || f.Score || f.score || 0,
        timecode: f.TIMECODE || f.Timecode || f.timecode || '00:00:00',
        duration: f.DURATION || f.Duration || f.duration || '0:00',
        notes: f.NOTES || f.Notes || f.notes || '',
        videoUrl: f['VIDEO URL'] || f.VideoURL || f.videoURL || f['Video URL'] || '',
        status: f.STATUS || f.Status || f.status || '',
      };
    });

    return Response.json({ clips });
  } catch (error) {
    return Response.json({ error: error.message, clips: [] }, { status: 500 });
  }
}
