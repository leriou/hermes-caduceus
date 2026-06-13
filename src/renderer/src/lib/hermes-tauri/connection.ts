import { invoke } from "@tauri-apps/api/core";

export function isRemoteMode(): Promise<boolean> {
  return invoke("is_remote_mode");
}
export function isRemoteOnlyMode(): Promise<boolean> {
  return invoke("is_remote_only_mode");
}
export function getConnectionConfig(): Promise<{
  mode: "local" | "remote" | "ssh";
  remoteUrl: string;
  hasApiKey: boolean;
  apiKeyLength: number;
  ssh: {
    host: string;
    port: number;
    username: string;
    keyPath: string;
    remotePort: number;
    localPort: number;
  };
}> {
  return invoke("get_connection_config");
}
export function setConnectionConfig(
  mode: string,
  remoteUrl: string,
  apiKey?: string,
): Promise<boolean> {
  return invoke("set_connection_config", { mode, remoteUrl, apiKey });
}
export function setSshConfig(
  host: string,
  port: number,
  username: string,
  keyPath: string,
  remotePort: number,
  localPort: number,
): Promise<boolean> {
  return invoke("set_ssh_config", {
    host,
    port,
    username,
    keyPath,
    remotePort,
    localPort,
  });
}
export function testRemoteConnection(
  url: string,
  apiKey?: string,
): Promise<boolean> {
  return invoke("test_remote_connection", { url, apiKey });
}
export function testSshConnection(
  host: string,
  port: number,
  username: string,
  keyPath: string,
  remotePort: number,
): Promise<boolean> {
  return invoke("test_ssh_connection", {
    host,
    port,
    username,
    keyPath,
    remotePort,
  });
}
export function isSshTunnelActive(): Promise<boolean> {
  return invoke("is_ssh_tunnel_active");
}
export function startSshTunnel(): Promise<boolean> {
  return invoke("start_ssh_tunnel");
}
export function stopSshTunnel(): Promise<boolean> {
  return invoke("stop_ssh_tunnel");
}
export function getGatewayWsPort(): Promise<string | null> {
  return invoke("get_gateway_ws_port");
}
