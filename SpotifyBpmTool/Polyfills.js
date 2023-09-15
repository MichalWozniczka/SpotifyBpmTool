import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";

export const applyGlobalPolyfills = () => {
  const { TextEncoder, TextDecoder } = require("text-encoding");
  const base64 = require("base-64");

  polyfillGlobal("TextEncoder", () => TextEncoder);
  polyfillGlobal("TextDecoder", () => TextDecoder);
  polyfillGlobal("btoa", () => base64.encode);
  polyfillGlobal("atob", () => base64.decode);
}