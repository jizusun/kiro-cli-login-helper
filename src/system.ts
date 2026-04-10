import os from "node:os";

function getLocalIP(): string {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (!iface.internal && iface.family === "IPv4") return iface.address;
    }
  }
  return "unknown";
}

export function hostFacts() {
  return [
    { title: "Host", value: os.hostname() },
    { title: "User", value: os.userInfo().username },
    { title: "Platform", value: `${os.platform()} ${os.arch()}` },
    { title: "IP", value: getLocalIP() },
    { title: "Time", value: new Date().toLocaleString() },
  ];
}
