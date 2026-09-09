export async function generateSpeech(text: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const maxLength = 200;

  for (let i = 0; i < text.length; i += maxLength) {
    const chunk = text.substring(i, i + maxLength);
    const encodedText = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      chunks.push(buffer);
    }
  }

  return Buffer.concat(chunks);
}
