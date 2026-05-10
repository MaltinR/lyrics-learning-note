import axios from "axios";
import type Lang from "~/interfaces/lang";

export async function detectLang(fullLyrics: string) {
  const url = "/api/detect-lang";
  const payload = {
    fullLyrics,
  };
  console.log(payload);
  const res = await axios.post(url, payload);
  const data: {
    lang: string;
  } = res.data;
  return data.lang;
}

export async function getFromLangs(): Promise<Array<Lang>> {
    return getLangs("from");
}

export async function getToLangs(): Promise<Array<Lang>> {
    return getLangs("to");
}

async function getLangs(type: string): Promise<Array<Lang>> {
    const url = `/api/langs/${type}`;
    const res = await axios.get(url);
    const data : {
        langs: Array<{
            lang: string;
            name: string;
        }>
    } = res.data;
    return data.langs.map(el => ({
        id: el.lang,
        name: el.name,
    }))
}