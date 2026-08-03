import type { APIRoute } from 'astro';

interface LangColor {
  name: string;
  percentage: number;
  color: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Astro: '#ff5a03',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Lua: '#000080',
  R: '#198CE7',
  Scala: '#c22d40',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Zig: '#ec915c',
  Nix: '#7e7eff',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Jupyter: '#F37626',
  TeX: '#3D6117',
  Markdown: '#083fa1',
  ObjectiveC: '#438eff',
  VimScript: '#199f4b',
  MATLAB: '#e16737',
  Assembly: '#6E4C13',
  Fortran: '#4d41b1',
  Perl: '#0298c3',
};

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || hashStringToColor(lang);
}



export const GET: APIRoute = async ({ url }) => {
  const username = 'kev289';
  const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const themeParam = (url.searchParams.get('theme') || 'auto').toLowerCase();
  const theme = ['dark', 'light', 'auto'].includes(themeParam) ? themeParam : 'auto';

  let totalCommits = 537;
  let longestStreak = 18;
  let currentStreak = 5;

  let topLanguages: LangColor[] = [
    { name: 'TypeScript', percentage: 53, color: '#3178c6' },
    { name: 'JavaScript', percentage: 21, color: '#f1e05a' },
    { name: 'Python', percentage: 21, color: '#3572A5' },
    { name: 'HTML', percentage: 5, color: '#e34c26' },
  ];

  const headers: Record<string, string> = {
    'User-Agent': 'Astro-Readme-Agent',
  };

  if (token && token !== 'your_github_token_here') {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    if (token && token !== 'your_github_token_here') {
      const graphqlQuery = {
        query: `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
              repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                  languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                    edges {
                      size
                      node {
                        name
                        color
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { username },
      };

      const graphqlRes = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Astro-Readme-Agent',
        },
        body: JSON.stringify(graphqlQuery),
      });

      if (graphqlRes.ok) {
        const graphqlData = await graphqlRes.json();
        const userNode = graphqlData?.data?.user;

        if (userNode) {
          const calendar = userNode.contributionsCollection?.contributionCalendar;
          if (calendar) {
            totalCommits = calendar.totalContributions;

            const days: { date: string; contributionCount: number }[] = [];
            calendar.weeks.forEach((w: any) => {
              if (w.contributionDays) {
                w.contributionDays.forEach((d: any) => {
                  days.push(d);
                });
              }
            });

            days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let calculatedLongest = 0;
            let tempStreak = 0;

            for (let i = 0; i < days.length; i++) {
              if (days[i].contributionCount > 0) {
                tempStreak++;
                if (tempStreak > calculatedLongest) {
                  calculatedLongest = tempStreak;
                }
              } else {
                tempStreak = 0;
              }
            }
            longestStreak = calculatedLongest;

            let calculatedCurrent = 0;
            let curIndex = days.length - 1;

            if (curIndex >= 0) {
              const lastDay = days[curIndex];
              if (lastDay.contributionCount === 0 && curIndex > 0) {
                const prevDay = days[curIndex - 1];
                if (prevDay.contributionCount > 0) {
                  curIndex--;
                }
              }
              while (curIndex >= 0 && days[curIndex].contributionCount > 0) {
                calculatedCurrent++;
                curIndex--;
              }
            }
            currentStreak = calculatedCurrent;
          }

          const repos = userNode.repositories?.nodes;
          if (repos && repos.length > 0) {
            const langSizeMap: Record<string, { size: number; color: string }> = {};
            let totalSize = 0;

            repos.forEach((repo: any) => {
              if (repo.languages && repo.languages.edges) {
                repo.languages.edges.forEach((edge: any) => {
                  const langName = edge.node.name;
                  const langColor = edge.node.color || getLanguageColor(langName);
                  
                  if (!langSizeMap[langName]) {
                    langSizeMap[langName] = { size: 0, color: langColor };
                  }
                  langSizeMap[langName].size += edge.size;
                  totalSize += edge.size;
                });
              }
            });

            if (totalSize > 0) {
              topLanguages = Object.entries(langSizeMap)
                .map(([name, data]) => ({
                  name,
                  percentage: Math.round((data.size / totalSize) * 100),
                  color: data.color,
                }))
                .filter(lang => lang.percentage > 0)
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 4);
            }
          }
        }
      } else {
        console.error('GraphQL Error:', await graphqlRes.text());
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub API, using fallback data:', error);
  }

  const darkPalette = {
    background: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    text: '#e6edf3',
    green: '#4AF626',
    gray: '#8b949e',
    blue: '#58a6ff',
  };

  const lightPalette = {
    background: '#ffffff',
    surface: '#f6f8fa',
    border: '#d0d7de',
    text: '#1f2328',
    green: '#1a7f37',
    gray: '#656d76',
    blue: '#0969da',
  };

  const palette = theme === 'light' ? lightPalette : darkPalette;

  let langSvg = '';
  topLanguages.forEach((lang, index) => {
    const yPos = 465 + index * 25;
    const rectYPos = 455 + index * 25;
    const textYPos = 463 + index * 25;
    const fillWidth = Math.round((lang.percentage / 100) * 550);
    const bgFill = theme === 'auto' ? 'var(--surface)' : palette.surface;
    const borderStroke = theme === 'auto' ? 'var(--border)' : palette.border;
    langSvg += `
  <!-- ${lang.name} Bar -->
  <text x="40" y="${yPos}" class="text-white font-12">${lang.name}</text>
  <rect x="160" y="${rectYPos}" width="550" height="8" rx="4" fill="${bgFill}" stroke="${borderStroke}"/>
  <rect x="160" y="${rectYPos}" width="${fillWidth}" height="8" rx="4" fill="${lang.color}"/>
  <text x="810" y="${textYPos}" class="text-gray font-12" text-anchor="end">${lang.percentage}%</text>`;
  });

  const cssVars = `
    :root {
      --bg: ${darkPalette.background};
      --surface: ${darkPalette.surface};
      --border: ${darkPalette.border};
      --text: ${darkPalette.text};
      --green: ${darkPalette.green};
      --gray: ${darkPalette.gray};
      --blue: ${darkPalette.blue};
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: ${lightPalette.background};
        --surface: ${lightPalette.surface};
        --border: ${lightPalette.border};
        --text: ${lightPalette.text};
        --green: ${lightPalette.green};
        --gray: ${lightPalette.gray};
        --blue: ${lightPalette.blue};
      }
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: ${darkPalette.background};
        --surface: ${darkPalette.surface};
        --border: ${darkPalette.border};
        --text: ${darkPalette.text};
        --green: ${darkPalette.green};
        --gray: ${darkPalette.gray};
        --blue: ${darkPalette.blue};
      }
    }
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 840" width="100%" height="100%" lang="en">
  <style>
    ${theme === 'auto' ? cssVars : ''}
    .terminal-bg { fill: ${theme === 'auto' ? 'var(--bg)' : palette.background}; }
    .border-main { stroke: ${theme === 'auto' ? 'var(--border)' : palette.border}; stroke-width: 1; fill: none; }
    .header-bar { fill: ${theme === 'auto' ? 'var(--surface)' : palette.surface}; stroke: ${theme === 'auto' ? 'var(--border)' : palette.border}; stroke-width: 1; }
    .text-white { fill: ${theme === 'auto' ? 'var(--text)' : palette.text}; font-family: "Courier New", Courier, monospace; }
    .text-green { fill: ${theme === 'auto' ? 'var(--green)' : palette.green}; font-family: "Courier New", Courier, monospace; }
    .text-gray { fill: ${theme === 'auto' ? 'var(--gray)' : palette.gray}; font-family: "Courier New", Courier, monospace; }
    .text-blue { fill: ${theme === 'auto' ? 'var(--blue)' : palette.blue}; font-family: "Courier New", Courier, monospace; }

    .font-bold { font-weight: bold; }
    .font-11 { font-size: 11px; }
    .font-12 { font-size: 12px; }
    .font-13 { font-size: 13px; }
    .font-14 { font-size: 14px; }
    .font-18 { font-size: 18px; }
    .font-32 { font-size: 32px; }

    @keyframes blink {
      50% { opacity: 0; }
    }
    .cursor {
      animation: blink 1s step-end infinite;
    }
  </style>

  <!-- Outer background and border -->
  <rect width="850" height="840" class="terminal-bg" rx="10"/>
  <rect width="848" height="838" x="1" y="1" class="border-main" rx="10"/>

  <!-- Fake Terminal Window Header -->
  <rect width="810" height="30" x="20" y="20" rx="6" class="header-bar"/>
  <circle cx="35" cy="35" r="6" fill="#ff5f56"/>
  <circle cx="55" cy="35" r="6" fill="#ffbd2e"/>
  <circle cx="75" cy="35" r="6" fill="#27c93f"/>
  <text x="100" y="39" class="text-gray font-12">~/kev - zsh</text>

  <!-- Main Profile Header inside terminal -->
  <text x="40" y="90" class="text-white font-bold font-32">Kevin Uribe</text>
  <text x="40" y="120" class="text-gray font-14">Software Engineer · Medellin · Colombia</text>


  <!-- Cyber Green Typewriter line -->
  <text x="40" y="155" class="text-green font-bold font-18">Full-Stack Developer <tspan class="cursor">|</tspan></text>
  <line x1="40" y1="175" x2="810" y2="175" stroke="${theme === 'auto' ? 'var(--border)' : palette.border}" stroke-width="1"/>

  <!-- TWO COLUMN MIDDLE GRID -->
  <!-- Left Column: About Section -->
  <text x="40" y="205" class="text-gray font-13">// ABOUT</text>
  <text x="40" y="235" class="text-white font-bold font-14">I build high-performance software that</text>
  <text x="40" y="255" class="text-white font-bold font-14">resolves real-world problems.</text>

  <text x="40" y="285" class="text-gray font-13">Focus on DX, quality, and maintainable</text>
  <text x="40" y="305" class="text-gray font-13">systems. Passionate software developer</text>
  <text x="40" y="325" class="text-gray font-13">from Colombia, specializing in modern</text>
  <text x="40" y="345" class="text-gray font-13">web applications and designing clean,</text>
  <text x="40" y="365" class="text-gray font-13">scalable system architectures.</text>

  <!-- Right Column: GitHub Stats Card -->
  <rect x="480" y="200" width="330" height="195" rx="8" class="header-bar"/>
  <text x="500" y="230" class="text-gray font-12">// GITHUB STATS</text>
  <line x1="500" y1="245" x2="790" y2="245" stroke="${theme === 'auto' ? 'var(--border)' : palette.border}" stroke-width="1"/>

  <text x="500" y="285" class="text-gray font-14">Total Contributions</text>
  <text x="790" y="285" class="text-blue font-bold font-14" text-anchor="end">${totalCommits}</text>

  <text x="500" y="330" class="text-gray font-14">Longest Streak</text>
  <text x="790" y="330" class="text-blue font-bold font-14" text-anchor="end">${longestStreak} days</text>

  <text x="500" y="375" class="text-gray font-14">Current Streak</text>
  <text x="790" y="375" class="text-blue font-bold font-14" text-anchor="end">${currentStreak} days</text>

  <!-- TOP LANGUAGES SECTION -->
  <text x="40" y="425" class="text-gray font-13">// TOP LANGUAGES</text>
  ${langSvg}

  <line x1="40" y1="555" x2="810" y2="555" stroke="${theme === 'auto' ? 'var(--border)' : palette.border}" stroke-width="1"/>

  <!-- TECH STACK SECTION -->
  <text x="40" y="580" class="text-gray font-13">// TECH STACK</text>

  <!-- Frontend Development Subheading -->
  <text x="40" y="608" class="text-white font-bold font-12">Frontend Development</text>
  <!-- TypeScript -->
  <rect x="40" y="620" width="100" height="24" rx="4" class="header-bar"/>
  <text x="90" y="636" class="text-gray font-12" text-anchor="middle">TypeScript</text>
  <!-- React -->
  <rect x="150" y="620" width="70" height="24" rx="4" class="header-bar"/>
  <text x="185" y="636" class="text-gray font-12" text-anchor="middle">React</text>
  <!-- Next.js -->
  <rect x="230" y="620" width="80" height="24" rx="4" class="header-bar"/>
  <text x="270" y="636" class="text-gray font-12" text-anchor="middle">Next.js</text>
  <!-- Tailwind CSS -->
  <rect x="320" y="620" width="105" height="24" rx="4" class="header-bar"/>
  <text x="372.5" y="636" class="text-gray font-12" text-anchor="middle">Tailwind CSS</text>

  <!-- Backend & Databases Subheading -->
  <text x="40" y="675" class="text-white font-bold font-12">Backend &amp; Databases</text>
  <!-- Node.js -->
  <rect x="40" y="687" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="703" class="text-gray font-12" text-anchor="middle">Node.js</text>
  <!-- Python -->
  <rect x="130" y="687" width="75" height="24" rx="4" class="header-bar"/>
  <text x="167.5" y="703" class="text-gray font-12" text-anchor="middle">Python</text>
  <!-- PostgreSQL -->
  <rect x="215" y="687" width="105" height="24" rx="4" class="header-bar"/>
  <text x="267.5" y="703" class="text-gray font-12" text-anchor="middle">PostgreSQL</text>
  <!-- MongoDB -->
  <rect x="330" y="687" width="85" height="24" rx="4" class="header-bar"/>
  <text x="372.5" y="703" class="text-gray font-12" text-anchor="middle">MongoDB</text>

  <!-- Tools & DevOps Subheading -->
  <text x="40" y="742" class="text-white font-bold font-12">Tools &amp; DevOps</text>
  <!-- Docker -->
  <rect x="40" y="754" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="770" class="text-gray font-12" text-anchor="middle">Docker</text>
  <!-- Azure -->
  <rect x="130" y="754" width="70" height="24" rx="4" class="header-bar"/>
  <text x="165" y="770" class="text-gray font-12" text-anchor="middle">Azure</text>
  <!-- Vercel -->
  <rect x="210" y="754" width="80" height="24" rx="4" class="header-bar"/>
  <text x="250" y="770" class="text-gray font-12" text-anchor="middle">Vercel</text>

  <!-- Fake Terminal Window Footer -->
  <rect width="810" height="30" x="20" y="790" rx="6" class="header-bar"/>
  <circle cx="35" cy="805" r="6" fill="#ff5f56"/>
  <circle cx="55" cy="805" r="6" fill="#ffbd2e"/>
  <circle cx="75" cy="805" r="6" fill="#27c93f"/>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
    },
  });
};
