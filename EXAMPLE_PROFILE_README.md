# Hi, I'm Kevin Uribe 👋

Welcome to my GitHub profile! I'm a Software Engineer from Colombia specializing in Full-Stack development.

<!-- THIS IS WHERE YOU CONSUME THE DYNAMIC SVG API -->
<div align="center">
  <a href="https://kev289.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://YOUR-VERCEL-URL.vercel.app/api/readme">
      <source media="(prefers-color-scheme: light)" srcset="https://YOUR-VERCEL-URL.vercel.app/api/readme">
      <!-- Fallback image -->
      <img src="https://YOUR-VERCEL-URL.vercel.app/api/readme" alt="Kevin Uribe - GitHub Profile Terminal" width="100%" />
    </picture>
  </a>
</div>

---

### How does this work? 🤔

The design above is not a static image or a third-party service. It is a **100% dynamic and autonomous SVG render** built by me, consuming the GitHub GraphQL API through an Astro SSR project hosted on Vercel.

* 📈 **Live Statistics:** Total contributions, longest streak, and current streak are calculated in real-time by iterating over my contribution calendar directly using the GitHub GraphQL API.
* 💻 **Dynamic Languages:** The "Top Languages" are aggregated by dynamically scanning my public repositories.
* ⚡ **Performance:** Everything is smartly cached (`s-maxage=60`) for ultra-fast loading without exhausting GitHub's API rate limits.

<br>
<div align="center">
  <i>Built with Astro SSR, TypeScript, and lots of coffee ☕</i>
</div>
