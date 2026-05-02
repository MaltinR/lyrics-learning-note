import axios from "axios";

export async function getTranslation(
  fromLang: string,
  toLang: string,
  content: string,
): Promise<string> {
  const url = "/api/translate";
  const payload = {
    fromLang,
    toLang,
    content,
  };
  const res = await axios.post(url, payload);
  const data: {
    fromLang: string;
    toLang: string;
    content: string;
    translation: string;
  } = res.data;
  return data.translation;
}
