import Cookies from "universal-cookie";

const cookies = new Cookies();

// Login
export const getToken = (): string => {
  const token = cookies.get("@tds/token");
  console.log(
    "[COOKIE] Getting token:",
    token ? "Token exists" : "No token found"
  );
  return token;
};

export const setToken = (token: string) => {
  cookies.set("@tds/token", token, { path: "/" });
};

export const removeToken = () => {
  cookies.remove("@tds/token", { path: "/" });
};
