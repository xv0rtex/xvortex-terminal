import packageJson from "../../package.json";
import themes from "../../themes.json";
import { formatDistanceToNow } from "date-fns";
import { history } from "../stores/history";
import { theme } from "../stores/theme";
import { todoManager } from "./todo";

const hostname = window.location.hostname;
// ---- Neofetch helpers and art ----
const macos = `
                    'c.
                 ,xNMM.
               .OMMMMo
               OMMM0,
     .;loddo:' loolloddol;.
   cKMMMMMMMMMMNWMMMMMMMMMM0:
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.
 XMMMMMMMMMMMMMMMMMMMMMMMX.
;MMMMMMMMMMMMMMMMMMMMMMMM:
:MMMMMMMMMMMMMMMMMMMMMMMM:
.MMMMMMMMMMMMMMMMMMMMMMMMX.
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMMMMMk.
       .cooc,.    .,coo:.
`;

const windows = `
                                ..,
                    ....,,:;+ccllll
      ...,,+:;  cllllllllllllllllll
,cclllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll

llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
llllllllllllll  lllllllllllllllllll
\`'ccllllllllll  lllllllllllllllllll
       \`' *::  :ccllllllllllllllll
                       \`\`\`\`''*::cll
`;

const linux = `
            .-/+oossssoo+/-.
        \`:+ssssssssssssssssss+:\`
      -+ssssssssssssssssssyyssss+-
    .ossssssssssssssssssdMMMNysssso.
   /ssssssssssshdmmNNmmyNMMMMhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
 /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
 .ssssssssdMMMNhsssssssssshNMMMdssssssss.
 /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/
  +sssssssssdmydMMMMMMMMddddyssssssss+
 /ssssssssssshdmNNNNmyNMMMMhssssss/
 .ossssssssssssssssssdMMMNysssso.
      -+sssssssssssssssssyyyssss+-
        \`:+ssssssssssssssssss+:\`
            .-/+oossssoo+/-.
`;

const getPlatform = (): "Unknown" | "Windows" | "MacOS" | "Linux" => {
  let os: "Unknown" | "Windows" | "MacOS" | "Linux" = "Unknown";
  if (navigator.userAgent.indexOf("Win") !== -1) os = "Windows";
  if (navigator.userAgent.indexOf("Mac") !== -1) os = "MacOS";
  if (navigator.userAgent.indexOf("Linux") !== -1) os = "Linux";
  return os;
};

const getMainColor = () => {
  const themeName = (localStorage.getItem("theme") || "").toLowerCase();
  const themeObj =
    themes.find((t) => t.name.toLowerCase() === themeName) ||
    themes.find((t) => t.name === "GruvboxDark");
  return themeObj?.cyan || "#00FFFF";
};

const getArt = () => {
  const mainColor = getMainColor();
  return `<pre style="color: ${mainColor}">${macos}</pre>`;
};

const getInfo = () => {
  const os = getPlatform();
  const visitedAt = new Date(
    localStorage.getItem("visitedAt") || new Date().toString()
  );
  const hostname = window.location.hostname;
  const themeName = localStorage.getItem("theme") || "";
  const resolution = `${window.screen.availWidth}x${window.screen.availHeight}`;
  const packages = Object.keys((packageJson as any).dependencies || {});
  const devPackages = Object.keys((packageJson as any).devDependencies || {});
  const mainColor = getMainColor();

  let message = "";
  message += `<span style="color: ${mainColor}">Host</span>: ${hostname}\n`;
  message += `<span style="color: ${mainColor}">OS</span>: ${os}\n`;
  message += `<span style="color: ${mainColor}">Packages</span>: ${
    packages.length + devPackages.length
  } (npm)\n`;
  message += `<span style="color: ${mainColor}">Resolution</span>: ${resolution}\n`;
  message += `<span style="color: ${mainColor}">Shell</span>: m4tt72-web\n`;
  message += `<span style="color: ${mainColor}">Theme</span>: ${themeName}\n`;
  message += `<span style="color: ${mainColor}">Version</span>: ${packageJson.version}\n`;
  message += `<span style="color: ${mainColor}">Repo</span>: <a href="${(packageJson as any).repository?.url}" target="_blank">${(packageJson as any).repository?.url}</a>\n`;
  message += `<span style="color: ${mainColor}">Uptime</span>: ${formatDistanceToNow(
    visitedAt
  )}\n`;
  
  return message;
};

// Portfolio content and links (customizable via env)
const aboutText =
  import.meta.env.VITE_ABOUT_TEXT ||
  "¡Hola! Mi nombre es Diego, estudiante de Ingeniería de la Ciberseguridad con pasión por la tecnología y la innovación.\n\nTrabajo en proyectos de automatización, inteligencia artificial y desarrollo web.\n\nTambién tengo experiencia en administración de servidores, configuración de redes y análisis de seguridad ofensiva.\n\nMi enfoque en el aprendizaje constante y la adaptación a nuevos retos me impulsa a seguir creciendo y aportando soluciones en el campo de la ciberseguridad. 🔐💻";
const projectsText =
  import.meta.env.VITE_PROJECTS_TEXT ||
  " - Administración de sistemas Linux\n - Virtualización con Proxmox y Docker\n - Configuración de redes y servicios (DNS, Samba, correo, VLANs…)\n - Automatización con Bash y scripts personalizados\n - Seguridad informática y análisis de vulnerabilidades\n - Implementación de entornos de laboratorio y simulaciones de ataques\n - Desarrollo de proyectos con inteligencia artificial aplicada\n - Gestión y despliegue de servidores\n - Programación en Python y Java";
const linkedinUrl =
  import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/in/diego-soria-ruiz-47764b20a/";
const githubUrl = import.meta.env.VITE_GITHUB_URL || "https://github.com/darkxvortex/";

export const commands: Record<string, (args: string[]) => Promise<string> | string> = {
  help: () => {
    const categories = {
      Personal: ["whoami", "about", "proyects", "github", "linkedin", "email"],
      System: ["help", "clear", "date", "exit", "neofetch", "echo", "sudo"],
      Productivity: ["todo", "weather"],
      Customization: ["theme", "banner"],
      Network: ["curl", "hostname"],
      //Contact: ["repo", "donate"],
      //Fun: ["echo", "sudo", "vi", "vim", "emacs"],
    } as const;

    let output = "Available commands:\n\n";

    for (const [category, cmds] of Object.entries(categories)) {
      output += `${category}:\n`;
      output += cmds.map((cmd) => `  ${cmd}`).join("\n");
      output += "\n\n";
    }

    // Mostrar comandos deshabilitados como comentados
    //const disabled = ["vi", "vim", "emacs", "donate"];
    //output += "Deshabilitados:\n";
    //output += disabled.map((cmd) => `  # ${cmd}`).join("\n");
    //output += "\n\n";

    output +=
      'Type "[command] help" or "[command]" without args for more info.';

    return output;
  },
  // Portfolio commands
  about: () => {
    return aboutText;
  },
  proyects: () => {
    return projectsText;
  },
  linkedin: () => {
    window.open(linkedinUrl, "_blank");
    return "Abriendo LinkedIn...";
  },
  github: () => {
    window.open(githubUrl, "_blank");
    return "Abriendo GitHub...";
  },
  neofetch: async (_args?: string[]): Promise<string> => {
    const art = getArt();
    const info = getInfo();
    return `
      <table>
        <tr>
          <td>${art}</td>
          <td><pre>${info}</pre></td>
        </tr>
      </table>
    `;
  },
  
  hostname: () => hostname,
  whoami: () => "¡Hola! Mi nombre es Diego, estudiante de Ingeniería de la Ciberseguridad con pasión por la tecnología y la innovación.\nTrabajo en proyectos de automatización, inteligencia artificial y desarrollo web.\nTambién tengo experiencia en administración de servidores, configuración de redes y análisis de seguridad ofensiva.\nMi enfoque en el aprendizaje constante y la adaptación a nuevos retos me impulsa a seguir creciendo y aportando soluciones en el campo de la ciberseguridad. 🔐💻",
  date: () => new Date().toLocaleString(),
  // vi: () => `why use vi? try 'emacs'`,
  // vim: () => `why use vim? try 'emacs'`,
  // emacs: () => `why use emacs? try 'vim'`,
  echo: (args: string[]) => args.join(" "),
  sudo: (args: string[]) => {
    window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    return `Permission denied: unable to run the command '${args[0]}' as root.`;
  },
  theme: (args: string[]) => {
    const usage = `Usage: theme [args].
    [args]:
      ls: list all available themes
      set: set theme to [theme]

    [Examples]:
      theme ls
      theme set gruvboxdark
    `;
    if (args.length === 0) {
      return usage;
    }

    switch (args[0]) {
      case "ls": {
        let result = themes.map((t) => t.name.toLowerCase()).join(", ");
        result += `You can preview all these themes here: ${packageJson.repository.url}/tree/master/docs/themes`;

        return result;
      }

      case "set": {
        if (args.length !== 2) {
          return usage;
        }

        const selectedTheme = args[1];
        const t = themes.find((t) => t.name.toLowerCase() === selectedTheme);

        if (!t) {
          return `Theme '${selectedTheme}' not found. Try 'theme ls' to see all available themes.`;
        }

        theme.set(t);

        return `Theme set to ${selectedTheme}`;
      }

      default: {
        return usage;
      }
    }
  },
  repo: () => {
    window.open(packageJson.repository.url, "_blank");

    return "Opening repository...";
  },
  clear: () => {
    history.set([]);

    return "";
  },
  email: () => {
    window.open(`mailto:${packageJson.author.email}`);

    return `Opening mailto:${packageJson.author.email}...`;
  },
  // donate: () => {
  //   window.open(packageJson.funding.url, "_blank");
  //   return "Opening donation url...";
  // },
  weather: async (args: string[]) => {
    const city = args.join("+");

    if (!city) {
      return "Usage: weather [city]. Example: weather Brussels";
    }

    const weather = await fetch(`https://wttr.in/${city}?ATm`);

    return weather.text();
  },
  exit: () => {
    return "Please close the tab to exit.";
  },
  curl: async (args: string[]) => {
    if (args.length === 0) {
      return "curl: no URL provided";
    }

    const url = args[0];

    try {
      const response = await fetch(url);
      const data = await response.text();

      return data;
    } catch (error) {
      return `curl: could not fetch URL ${url}. Details: ${error}`;
    }
  },
  banner: () => `
██╗  ██╗██╗   ██╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
╚██╗██╔╝██║   ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
 ╚███╔╝ ██║   ██║██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝ 
 ██╔██╗ ╚██╗ ██╔╝██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗ 
██╔╝ ██╗ ╚████╔╝ ╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝ 
Welcome to xvortex terminal v${packageJson.version}

Type 'help' to explore.
`,
  todo: (args: string[]) => {
    const usage = `Usage: todo [command] [args]

Commands:
  add <text>     Add a new todo
  ls [filter]    List todos (filter: all, completed, pending)
  done <id>      Mark todo as completed
  rm <id>        Remove a todo
  clear [completed]  Clear todos (add 'completed' to clear only completed)
  stats          Show todo statistics

Examples:
  todo add Buy groceries
  todo ls
  todo ls pending
  todo done 1
  todo rm 2
  todo clear completed`;

    if (args.length === 0) {
      return usage;
    }

    const [subCommand, ...subArgs] = args;

    switch (subCommand) {
      case "add":
        if (subArgs.length === 0) {
          return "Error: Please provide todo text. Example: todo add Buy milk";
        }
        return todoManager.add(subArgs.join(" "));

      case "ls":
      case "list":
        const filter = subArgs[0] as
          | "all"
          | "completed"
          | "pending"
          | undefined;
        if (filter && !["all", "completed", "pending"].includes(filter)) {
          return "Error: Invalid filter. Use: all, completed, or pending";
        }
        return todoManager.list(filter);

      case "done":
      case "complete":
        const completeId = parseInt(subArgs[0]);
        if (isNaN(completeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.complete(completeId);

      case "rm":
      case "remove":
      case "delete":
        const removeId = parseInt(subArgs[0]);
        if (isNaN(removeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.remove(removeId);

      case "clear":
        const onlyCompleted = subArgs[0] === "completed";
        return todoManager.clear(onlyCompleted);

      case "stats":
        return todoManager.stats();

      default:
        return `Unknown todo command: ${subCommand}\n\n${usage}`;
    }
  },
};
