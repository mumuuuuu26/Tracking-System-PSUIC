const toSafeString = (value) => (value === null || value === undefined ? "" : String(value).trim());

const getEmailLocalPart = (email) => {
  const safeEmail = toSafeString(email);
  if (!safeEmail) return "";
  const atIndex = safeEmail.indexOf("@");
  return atIndex > 0 ? safeEmail.slice(0, atIndex) : safeEmail;
};

const toNameTokens = (value) =>
  toSafeString(value)
    .split(/[\s._-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const toTitleCase = (value) =>
  toSafeString(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getUserDisplayName = (user, fallback = "User") => {
  const explicitName = toSafeString(user?.name);
  if (explicitName) return explicitName;

  const username = toSafeString(user?.username);
  if (username) return username;

  const localPart = getEmailLocalPart(user?.email);
  if (localPart) return toTitleCase(localPart.replace(/[._-]+/g, " "));

  return fallback;
};

export const getUserInitials = (user, fallback = "U") => {
  const tokens = toNameTokens(getUserDisplayName(user, fallback));
  if (tokens.length === 0) return fallback.slice(0, 1).toUpperCase();

  if (tokens.length === 1) {
    const token = tokens[0];
    if (token.length < 2) return token.slice(0, 1).toUpperCase();
    return `${token[0]}${token[1]}`.toUpperCase();
  }

  const first = tokens[0].charAt(0);
  const last = tokens[tokens.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
};
