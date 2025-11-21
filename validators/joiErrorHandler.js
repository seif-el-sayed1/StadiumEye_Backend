const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
function joiErrorHandler(schema, req) {
  const lang = req.headers?.lang?.toLowerCase() || "en";
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    context: { lang }
  });

  if (!error) return;

  let message = error.details[0].message.replace(/"/g, "").split(" ");

  if (message[0]?.endsWith(`_${lang}`)) {
    const language = lang === "en" ? "English" : "Arabic";
    message = `${language} ${message[0].slice(0, -3)} ${message.slice(1).join(" ")}`;
  } else {
    message = message.join(" ").split("_").join(" ");
    message = `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
  }
 
  throw new ApiError(translate(message, lang), 400);
}

module.exports = joiErrorHandler;
