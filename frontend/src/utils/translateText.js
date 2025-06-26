import axios from 'axios';

const translateText = async (text, targetLang = 'hi') => {
  try {
    const res = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
      },
      { headers: { accept: 'application/json' } }
    );
    return res.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export default translateText;
