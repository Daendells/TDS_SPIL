import Cookies from "universal-cookie";

const cookies = new Cookies();

// Login
export const getToken = (): string => {
  const token = cookies.get("Authorization");
  console.log(
    "[COOKIE] Getting token:",
    token ? "Token exists" : "No token found"
  );
  return token;
};

export const setToken = (token: string) => {
  cookies.set("Authorization", token, { path: "/" });
};

export const removeToken = () => {
  cookies.remove("Authorization", { path: "/" });
};
