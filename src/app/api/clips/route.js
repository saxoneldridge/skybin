export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableName}?pageSize=100&sort[0][field]=SCORE&sort[0][direction]=desc`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      }
    );
    if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
    const data = await response.json();
    const clips = data.records.map((record) => ({
      id: record.id,
      title: record.fields.TITLE || record.fields.Title || 'Untitled',
      bin: (record.fields.BIN || record.fields.Bin || 'broll').toLowerCase(),
      tags: record.fields.TAGS || record.fields.Tags ? typeof (record.fields.TAGS || record.fields.Tags) === 'string' ? (record.fields.TAGS || record.fields.Tags).split(',').map(t => t.trim()) : (record.fields.TAGS || record.fields.Tags) : [],
      score: record.fields.SCORE || record.fields.Score || 0,
      timecode: record.fields.TIMECODE || record.fields.Timecode || '00:00:00',
      duration: record.fields.DURATION || record.fields.Duration || '0:00',
      notes: record.fields.NOTES || record.fields.Notes || '',
      videoUrl: record.fields['VIDEO URL'] || record.fields.VideoURL || '',
      status: record.fields.STATUS || record.fields.Status || '',
    }));
    return Response.json({ clips });
  } catch (error) {
    return Response.json({ error: error.message, clips: [] }, { status: 500 });
  }
}
