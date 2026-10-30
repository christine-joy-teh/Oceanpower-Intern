let pipelinePromise = null;

async function getEmbedder() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5');
    })();
  }
  return pipelinePromise;
}

// Deterministic, dependency-free stand-in for the real embedding model.
// Used only when RAG_FAKE_EMBEDDINGS=1, so automated tests never need
// network access or a downloaded model.
function fakeEmbed(text) {
  const vector = new Array(16).fill(0);
  const str = String(text || '');
  for (let i = 0; i < str.length; i += 1) {
    vector[i % 16] += str.charCodeAt(i);
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

async function embed(text) {
  if (process.env.RAG_FAKE_EMBEDDINGS === '1') {
    return fakeEmbed(text);
  }
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

module.exports = { embed, fakeEmbed };
