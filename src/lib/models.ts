export const responseModels = [
  {
    id: "dots-studio/dots-3-note-preview:free",
    name: "Dots 3 Note",
    provider: "Dots Studio",
    access: "Free",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super",
    provider: "NVIDIA",
    access: "Free",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    access: "Paid",
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "DeepSeek",
    access: "Paid",
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1 0528",
    provider: "DeepSeek",
    access: "Paid",
  },
] as const;

export type ResponseModelId = (typeof responseModels)[number]["id"];

export const defaultResponseModel: ResponseModelId = responseModels[0].id;

export function isResponseModelId(value: unknown): value is ResponseModelId {
  return typeof value === "string" && responseModels.some(({ id }) => id === value);
}

export function getResponseModel(value: ResponseModelId) {
  return responseModels.find(({ id }) => id === value) ?? responseModels[0];
}
