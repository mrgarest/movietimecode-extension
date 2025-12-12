const toNumber = (value: string | null) =>
  value != null ? Number(value) : null;

export const getValue = (name: string, input: string) => {
  const match = input.match(new RegExp(`${name}=(.*?)(;| )`));
  return match && match[1] !== "" ? match[1] : null;
};
export const getBoolean = (name: string, input: string) =>
  input.includes(name + "=1");

export const getMessage = (input: string) => {
  const match = input.match(/ #.+? :(.+)$/m);
  return match ? match[1] : null;
};
export const getChannel = (input: string) => {
  const match = input.match(/ #([\S]+)/m);
  return match ? match[1] : null;
};

export const isMod = (input: string) => getBoolean("mod", input);
export const isVip = (input: string) => getBoolean("vip", input);

export const getRoomId = (input: string) =>
  toNumber(getValue("room-id", input));

export const getDisplayName = (input: string) =>
  getValue("display-name", input);

export const getUserId = (input: string) =>
  toNumber(getValue("user-id", input));

export const getId = (input: string) => getValue("id", input);

export const getMsgParamRecipientId = (input: string) =>
  toNumber(getValue("msg-param-recipient-id", input));
export const getTmiSentTimestamp = (input: string) =>
  toNumber(getValue("tmi-sent-ts", input));
