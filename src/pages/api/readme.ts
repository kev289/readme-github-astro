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

async function fetchAllRepos(username: string, headers: Record<string, string>) {
  const allRepos: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
      { headers }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allRepos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return allRepos;
}

export const GET: APIRoute = async ({ url }) => {
  const username = 'kev289';
  const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const theme = url.searchParams.get('theme') === 'light' ? 'light' : 'dark';

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
    const allRepos = await fetchAllRepos(username, headers);

    if (allRepos.length > 0) {
      const activeRepos = allRepos.filter(
        (repo: any) => !repo.fork && !repo.archived
      );

      const languageCounts: Record<string, number> = {};
      activeRepos.forEach((repo: any) => {
        if (repo.language) {
          languageCounts[repo.language] =
            (languageCounts[repo.language] || 0) + 1;
        }
      });

      const totalReposWithLanguage = Object.values(languageCounts).reduce(
        (a, b) => a + b,
        0
      );
      if (totalReposWithLanguage > 0) {
        const sortedLanguages = Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        topLanguages = sortedLanguages.map(([name, count]) => {
          const percentage = Math.round(
            (count / totalReposWithLanguage) * 100
          );
          return {
            name,
            percentage,
            color: getLanguageColor(name),
          };
        });
      }
    }

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
        const calendar =
          graphqlData?.data?.user?.contributionsCollection
            ?.contributionCalendar;
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

          days.sort(
            (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );

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
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub API, using fallback data:', error);
  }

  const palette =
    theme === 'light'
      ? {
          background: '#ffffff',
          surface: '#f6f8fa',
          border: '#d0d7de',
          text: '#24292f',
          green: '#1a7f37',
          gray: '#57606a',
          blue: '#0969da',
        }
      : {
          background: '#0d1117',
          surface: '#161b22',
          border: '#30363d',
          text: '#ffffff',
          green: '#4AF626',
          gray: '#8b949e',
          blue: '#58a6ff',
        };

  let langSvg = '';
  topLanguages.forEach((lang, index) => {
    const yPos = 450 + index * 25;
    const rectYPos = 440 + index * 25;
    const textYPos = 448 + index * 25;
    const fillWidth = Math.round((lang.percentage / 100) * 550);
    langSvg += `
  <!-- ${lang.name} Bar -->
  <text x="40" y="${yPos}" class="text-white font-12">${lang.name}</text>
  <rect x="160" y="${rectYPos}" width="550" height="8" rx="4" fill="${palette.surface}" stroke="${palette.border}"/>
  <rect x="160" y="${rectYPos}" width="${fillWidth}" height="8" rx="4" fill="${lang.color}"/>
  <text x="810" y="${textYPos}" class="text-gray font-12" text-anchor="end">${lang.percentage}%</text>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 845" width="100%" height="100%" lang="en">
  <style>
    .terminal-bg { fill: ${palette.background}; }
    .border-main { stroke: ${palette.border}; stroke-width: 1; fill: none; }
    .header-bar { fill: ${palette.surface}; stroke: ${palette.border}; stroke-width: 1; }
    .text-white { fill: ${palette.text}; font-family: "Courier New", Courier, monospace; }
    .text-green { fill: ${palette.green}; font-family: "Courier New", Courier, monospace; }
    .text-gray { fill: ${palette.gray}; font-family: "Courier New", Courier, monospace; }
    .text-blue { fill: ${palette.blue}; font-family: "Courier New", Courier, monospace; }

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
  <rect width="850" height="845" class="terminal-bg" rx="10"/>
  <rect width="848" height="843" x="1" y="1" class="border-main" rx="10"/>

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
  <line x1="40" y1="175" x2="810" y2="175" stroke="${palette.border}" stroke-width="1"/>

  <!-- TWO COLUMN MIDDLE GRID -->
  <!-- Left Column: About Section -->
  <text x="40" y="205" class="text-gray font-13">// ABOUT</text>
  <text x="40" y="235" class="text-white font-bold font-14">I build software that resolves real-world</text>
  <text x="40" y="255" class="text-white font-bold font-14">problems - quality first, scalability second.</text>

  <text x="40" y="285" class="text-gray font-13">A passionate software developer from Colombia.</text>
  <text x="40" y="305" class="text-gray font-13">I specialize in building high-performance,</text>
  <text x="40" y="325" class="text-gray font-13">modern web applications. I enjoy solving</text>
  <text x="40" y="345" class="text-gray font-13">complex problems and designing clean,</text>
  <text x="40" y="365" class="text-gray font-13">scalable system architectures.</text>

  <text x="40" y="395" class="text-gray font-13">&gt; React · TypeScript · Next.js · Astro</text>
  <text x="40" y="415" class="text-gray font-13">&gt; Node.js · PostgreSQL · Azure</text>

  <!-- Right Column: GitHub Stats Card -->
  <rect x="480" y="200" width="330" height="215" rx="8" class="header-bar"/>
  <text x="500" y="230" class="text-gray font-12">// GITHUB STATS</text>
  <line x1="500" y1="245" x2="790" y2="245" stroke="${palette.border}" stroke-width="1"/>

  <text x="500" y="290" class="text-gray font-14">Total Contributions</text>
  <text x="790" y="290" class="text-blue font-bold font-14" text-anchor="end">${totalCommits}</text>

  <text x="500" y="340" class="text-gray font-14">Longest Streak</text>
  <text x="790" y="340" class="text-blue font-bold font-14" text-anchor="end">${longestStreak} days</text>

  <text x="500" y="390" class="text-gray font-14">Current Streak</text>
  <text x="790" y="390" class="text-blue font-bold font-14" text-anchor="end">${currentStreak} days</text>

  <!-- TOP LANGUAGES SECTION -->
  <text x="40" y="420" class="text-gray font-13">// TOP LANGUAGES</text>
  ${langSvg}

  <line x1="40" y1="550" x2="810" y2="550" stroke="${palette.border}" stroke-width="1"/>

  <!-- TECH STACK SECTION -->
  <text x="40" y="575" class="text-gray font-13">// TECH STACK</text>

  <!-- Frontend Development Subheading -->
  <text x="40" y="600" class="text-white font-bold font-12">Frontend Development</text>
  <!-- TypeScript -->
  <rect x="40" y="612" width="100" height="24" rx="4" class="header-bar"/>
  <text x="90" y="628" class="text-gray font-12" text-anchor="middle">TypeScript</text>
  <!-- React -->
  <rect x="150" y="612" width="70" height="24" rx="4" class="header-bar"/>
  <text x="185" y="628" class="text-gray font-12" text-anchor="middle">React</text>
  <!-- Next.js -->
  <rect x="230" y="612" width="80" height="24" rx="4" class="header-bar"/>
  <text x="270" y="628" class="text-gray font-12" text-anchor="middle">Next.js</text>
  <!-- Tailwind CSS -->
  <rect x="320" y="612" width="105" height="24" rx="4" class="header-bar"/>
  <text x="372.5" y="628" class="text-gray font-12" text-anchor="middle">Tailwind CSS</text>
  <!-- Astro -->
  <rect x="435" y="612" width="70" height="24" rx="4" class="header-bar"/>
  <text x="470" y="628" class="text-gray font-12" text-anchor="middle">Astro</text>

  <!-- Backend & Databases Subheading -->
  <text x="40" y="665" class="text-white font-bold font-12">Backend &amp; Databases</text>
  <!-- Node.js -->
  <rect x="40" y="677" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="693" class="text-gray font-12" text-anchor="middle">Node.js</text>
  <!-- Python -->
  <rect x="130" y="677" width="75" height="24" rx="4" class="header-bar"/>
  <text x="167.5" y="693" class="text-gray font-12" text-anchor="middle">Python</text>
  <!-- PostgreSQL -->
  <rect x="215" y="677" width="105" height="24" rx="4" class="header-bar"/>
  <text x="267.5" y="693" class="text-gray font-12" text-anchor="middle">PostgreSQL</text>
  <!-- Prisma -->
  <rect x="330" y="677" width="80" height="24" rx="4" class="header-bar"/>
  <text x="370" y="693" class="text-gray font-12" text-anchor="middle">Prisma</text>
  <!-- MongoDB -->
  <rect x="420" y="677" width="85" height="24" rx="4" class="header-bar"/>
  <text x="462.5" y="693" class="text-gray font-12" text-anchor="middle">MongoDB</text>

  <!-- Tools & DevOps Subheading -->
  <text x="40" y="730" class="text-white font-bold font-12">Tools &amp; DevOps</text>
  <!-- Docker -->
  <rect x="40" y="742" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="758" class="text-gray font-12" text-anchor="middle">Docker</text>
  <!-- Azure -->
  <rect x="130" y="742" width="70" height="24" rx="4" class="header-bar"/>
  <text x="165" y="758" class="text-gray font-12" text-anchor="middle">Azure</text>
  <!-- Vercel -->
  <rect x="210" y="742" width="80" height="24" rx="4" class="header-bar"/>
  <text x="250" y="758" class="text-gray font-12" text-anchor="middle">Vercel</text>

  <!-- Fake Terminal Window Footer -->
  <rect width="810" height="30" x="20" y="780" rx="6" class="header-bar"/>
  <circle cx="35" cy="795" r="6" fill="#ff5f56"/>
  <circle cx="55" cy="795" r="6" fill="#ffbd2e"/>
  <circle cx="75" cy="795" r="6" fill="#27c93f"/>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control':
        'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
    },
  });
};
