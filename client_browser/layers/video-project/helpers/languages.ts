const rtl_languages = [
  {
    code: "ar",
    name: "Arabic",
  },
  {
    code: "dv",
    name: "Divehi",
  },
  {
    code: "fa",
    name: "Persian",
  },
  {
    code: "he",
    name: "Hebrew",
  },
  {
    code: "ps",
    name: "Pashto",
  },
  {
    code: "ur",
    name: "Urdu",
  },
  {
    code: "yi",
    name: "Yiddish",
  },
];

export function isRTL(language: string) {
  return rtl_languages.some((rtl) => {
    if (rtl.code === language) {
      return true;
    } else if (
      rtl.name.toLocaleLowerCase() === (language || "").toLocaleLowerCase()
    ) {
      return true;
    }
  });
}
