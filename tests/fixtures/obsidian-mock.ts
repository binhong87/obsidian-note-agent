export class Notice { constructor(public message: string) {} }
export class Plugin {}
export class ItemView {}
export class PluginSettingTab {}
export class Setting { constructor(public containerEl: unknown) {} }
export const requestUrl = async (_: unknown): Promise<unknown> => { throw new Error("mock requestUrl not stubbed"); };
export class TFile { constructor(public path: string) {} }
export class TFolder { constructor(public path: string) {} }
export class Vault {}
export class App {}
export const normalizePath = (p: string) => p.replace(/\\/g, "/");
export const moment = { locale: () => "en" };
