const normalizeBasePath = (value?: string) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed.replace(/\/+$/, "") : `/${trimmed.replace(/\/+$/, "")}`;
};

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const withBasePath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return BASE_PATH ? `${BASE_PATH}${normalizedPath}` : normalizedPath;
};

export const stripBasePath = (pathname: string) => {
  if (!BASE_PATH || !pathname.startsWith(BASE_PATH)) {
    return pathname;
  }

  const strippedPath = pathname.slice(BASE_PATH.length);
  return strippedPath || "/";
};
