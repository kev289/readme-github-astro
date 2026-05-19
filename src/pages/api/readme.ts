import type { APIRoute } from 'astro';

// Helper to calculate the current day of the year for dynamic commits
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export const GET: APIRoute = async () => {
  // 1. Fetching Live Stats with Fallback mechanism
  const username = 'kev289';
  const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;

  let totalStars = 0;
  let totalCommits = 537; // Fallback
  let longestStreak = 18; // Fallback
  let currentStreak = 5;  // Fallback

  let topLanguages = [
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
    // A. Fetch REST repositories to calculate stars and top languages
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
    if (reposRes.ok) {
      const reposData = await reposRes.json();
      if (Array.isArray(reposData)) {
        totalStars = reposData.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);

        // Map colors for top languages
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
        };

        const languageCounts: Record<string, number> = {};
        reposData.forEach(repo => {
          if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
          }
        });

        const totalReposWithLanguage = Object.values(languageCounts).reduce((a, b) => a + b, 0);
        if (totalReposWithLanguage > 0) {
          const sortedLanguages = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

          topLanguages = sortedLanguages.map(([name, count]) => {
            const percentage = Math.round((count / totalReposWithLanguage) * 100);
            return {
              name,
              percentage,
              color: LANGUAGE_COLORS[name] || '#8b949e',
            };
          });
        }
      }
    }

    // B. Fetch GraphQL Contribution Calendar for Commits and Streaks
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
        variables: { username }
      };

      const graphqlRes = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Astro-Readme-Agent'
        },
        body: JSON.stringify(graphqlQuery)
      });

      if (graphqlRes.ok) {
        const graphqlData = await graphqlRes.json();
        const calendar = graphqlData?.data?.user?.contributionsCollection?.contributionCalendar;
        if (calendar) {
          totalCommits = calendar.totalContributions;

          // Process days to calculate streaks
          const days: { date: string; contributionCount: number }[] = [];
          calendar.weeks.forEach((w: any) => {
            if (w.contributionDays) {
              w.contributionDays.forEach((d: any) => {
                days.push(d);
              });
            }
          });

          // Sort chronologically just in case
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

          // Calculate current streak (counting backwards from today/yesterday)
          let calculatedCurrent = 0;
          let curIndex = days.length - 1;

          if (curIndex >= 0) {
            // Allow today's count to be 0 without breaking yesterday's streak (since today is ongoing)
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

  // Generate dynamic Top Languages SVG tags
  let langSvg = '';
  topLanguages.forEach((lang, index) => {
    const yPos = 535 + index * 25;
    const rectYPos = 525 + index * 25;
    const textYPos = 533 + index * 25;
    const fillWidth = Math.round((lang.percentage / 100) * 550);
    langSvg += `
  <!-- ${lang.name} Bar -->
  <text x="40" y="${yPos}" class="text-white font-12">${lang.name}</text>
  <rect x="160" y="${rectYPos}" width="550" height="8" rx="4" fill="#161b22" stroke="#30363d"/>
  <rect x="160" y="${rectYPos}" width="${fillWidth}" height="8" rx="4" fill="${lang.color}"/>
  <text x="810" y="${textYPos}" class="text-gray font-12" text-anchor="end">${lang.percentage}%</text>`;
  });

  // 2. SVG Markup generation
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 930" width="100%" height="100%">
  <style>
    .terminal-bg { fill: #0d1117; }
    .border-main { stroke: #30363d; stroke-width: 1; fill: none; }
    .header-bar { fill: #161b22; stroke: #30363d; stroke-width: 1; }
    .text-white { fill: #ffffff; font-family: "Courier New", Courier, monospace; }
    .text-green { fill: #4AF626; font-family: "Courier New", Courier, monospace; }
    .text-gray { fill: #8b949e; font-family: "Courier New", Courier, monospace; }
    .text-blue { fill: #58a6ff; font-family: "Courier New", Courier, monospace; }
    
    .font-bold { font-weight: bold; }
    .font-11 { font-size: 11px; }
    .font-12 { font-size: 12px; }
    .font-13 { font-size: 13px; }
    .font-14 { font-size: 14px; }
    .font-18 { font-size: 18px; }
    .font-32 { font-size: 32px; }
    
    /* Typewriter animation style */
    @keyframes blink {
      50% { opacity: 0; }
    }
    .cursor {
      animation: blink 1s step-end infinite;
    }
  </style>

  <!-- Outer background and border -->
  <rect width="850" height="930" class="terminal-bg" rx="10"/>
  <rect width="848" height="928" x="1" y="1" class="border-main" rx="10"/>

  <!-- Fake Terminal Window Header -->
  <rect width="810" height="30" x="20" y="20" rx="6" class="header-bar"/>
  <circle cx="35" cy="35" r="6" fill="#ff5f56"/>
  <circle cx="55" cy="35" r="6" fill="#ffbd2e"/>
  <circle cx="75" cy="35" r="6" fill="#27c93f"/>
  <text x="100" y="39" class="text-gray font-12">~/kev - zsh</text>

  <!-- Main Profile Header inside terminal -->
  <text x="40" y="90" class="text-white font-bold font-32">Kevin Uribe</text>
  <text x="40" y="120" class="text-gray font-14">Software Engineer · Medellin · Colombia</text>
  
  <!-- Open for Work Badge -->
  <rect x="40" y="135" width="122" height="22" rx="11" class="header-bar"/>
  <circle cx="52" cy="146" r="4" fill="#4AF626"/>
  <text x="62" y="149" class="text-green font-bold font-11">Open for Work</text>

  <!-- Cyber Green Typewriter line -->
  <text x="40" y="190" class="text-green font-bold font-18">Full-Stack Developer <tspan class="cursor">|</tspan></text>
  <line x1="40" y1="210" x2="810" y2="210" stroke="#30363d" stroke-width="1"/>

  <!-- TWO COLUMN MIDDLE GRID -->
  <!-- Left Column: About Section -->
  <text x="40" y="240" class="text-gray font-13">// ABOUT</text>
  <text x="40" y="270" class="text-white font-bold font-14">I build software that resolves real-world</text>
  <text x="40" y="290" class="text-white font-bold font-14">problems - quality first, scalability second.</text>
  
  <text x="40" y="320" class="text-gray font-13">A passionate software developer from Colombia.</text>
  <text x="40" y="340" class="text-gray font-13">I specialize in building high-performance,</text>
  <text x="40" y="360" class="text-gray font-13">modern web applications. I enjoy solving</text>
  <text x="40" y="380" class="text-gray font-13">complex problems and designing clean,</text>
  <text x="40" y="400" class="text-gray font-13">scalable system architectures.</text>
  
  <text x="40" y="430" class="text-gray font-13">&gt; React · TypeScript · Next.js · Astro</text>
  <text x="40" y="450" class="text-gray font-13">&gt; Node.js · PostgreSQL · Azure</text>

  <!-- Right Column: GitHub Stats Card -->
  <rect x="480" y="235" width="330" height="230" rx="8" class="header-bar"/>
  <text x="500" y="265" class="text-gray font-12">// GITHUB STATS</text>
  <line x1="500" y1="280" x2="790" y2="280" stroke="#30363d" stroke-width="1"/>
  
  <text x="500" y="325" class="text-gray font-14">Total Contributions</text>
  <text x="790" y="325" class="text-blue font-bold font-14" text-anchor="end">${totalCommits}</text>

  <text x="500" y="375" class="text-gray font-14">Longest Streak</text>
  <text x="790" y="375" class="text-blue font-bold font-14" text-anchor="end">${longestStreak} days</text>

  <text x="500" y="425" class="text-gray font-14">Current Streak</text>
  <text x="790" y="425" class="text-blue font-bold font-14" text-anchor="end">${currentStreak} days</text>

  <!-- TOP LANGUAGES SECTION -->
  <text x="40" y="505" class="text-gray font-13">// TOP LANGUAGES</text>
  ${langSvg}

  <line x1="40" y1="635" x2="810" y2="635" stroke="#30363d" stroke-width="1"/>

  <!-- TECH STACK SECTION -->
  <text x="40" y="660" class="text-gray font-13">// TECH STACK</text>

  <!-- Frontend Development Subheading -->
  <text x="40" y="685" class="text-white font-bold font-12">Frontend Development</text>
  <!-- TypeScript -->
  <rect x="40" y="697" width="100" height="24" rx="4" class="header-bar"/>
  <text x="90" y="713" class="text-gray font-12" text-anchor="middle">TypeScript</text>
  <!-- React -->
  <rect x="150" y="697" width="70" height="24" rx="4" class="header-bar"/>
  <text x="185" y="713" class="text-gray font-12" text-anchor="middle">React</text>
  <!-- Next.js -->
  <rect x="230" y="697" width="80" height="24" rx="4" class="header-bar"/>
  <text x="270" y="713" class="text-gray font-12" text-anchor="middle">Next.js</text>
  <!-- Tailwind CSS -->
  <rect x="320" y="697" width="105" height="24" rx="4" class="header-bar"/>
  <text x="372.5" y="713" class="text-gray font-12" text-anchor="middle">Tailwind CSS</text>
  <!-- Astro -->
  <rect x="435" y="697" width="70" height="24" rx="4" class="header-bar"/>
  <text x="470" y="713" class="text-gray font-12" text-anchor="middle">Astro</text>

  <!-- Backend & Databases Subheading -->
  <text x="40" y="750" class="text-white font-bold font-12">Backend &amp; Databases</text>
  <!-- Node.js -->
  <rect x="40" y="762" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="778" class="text-gray font-12" text-anchor="middle">Node.js</text>
  <!-- Python -->
  <rect x="130" y="762" width="75" height="24" rx="4" class="header-bar"/>
  <text x="167.5" y="778" class="text-gray font-12" text-anchor="middle">Python</text>
  <!-- PostgreSQL -->
  <rect x="215" y="762" width="105" height="24" rx="4" class="header-bar"/>
  <text x="267.5" y="778" class="text-gray font-12" text-anchor="middle">PostgreSQL</text>
  <!-- Prisma -->
  <rect x="330" y="762" width="80" height="24" rx="4" class="header-bar"/>
  <text x="370" y="778" class="text-gray font-12" text-anchor="middle">Prisma</text>
  <!-- MongoDB -->
  <rect x="420" y="762" width="85" height="24" rx="4" class="header-bar"/>
  <text x="462.5" y="778" class="text-gray font-12" text-anchor="middle">MongoDB</text>

  <!-- Tools & DevOps Subheading -->
  <text x="40" y="815" class="text-white font-bold font-12">Tools &amp; DevOps</text>
  <!-- Docker -->
  <rect x="40" y="827" width="80" height="24" rx="4" class="header-bar"/>
  <text x="80" y="843" class="text-gray font-12" text-anchor="middle">Docker</text>
  <!-- Azure -->
  <rect x="130" y="827" width="70" height="24" rx="4" class="header-bar"/>
  <text x="165" y="843" class="text-gray font-12" text-anchor="middle">Azure</text>
  <!-- Vercel -->
  <rect x="210" y="827" width="80" height="24" rx="4" class="header-bar"/>
  <text x="250" y="843" class="text-gray font-12" text-anchor="middle">Vercel</text>

  <!-- Fake Terminal Window Footer -->
  <rect width="810" height="30" x="20" y="865" rx="6" class="header-bar"/>
  <circle cx="35" cy="880" r="6" fill="#ff5f56"/>
  <circle cx="55" cy="880" r="6" fill="#ffbd2e"/>
  <circle cx="75" cy="880" r="6" fill="#27c93f"/>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
    },
  });
};
