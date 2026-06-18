import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import JSZip from "jszip";

function toId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "myapp";
}
function toPkg(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "my-app";
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return new Response("Not found", { status: 404 });
  if (!project.versions[0]) return new Response("No generated version yet", { status: 400 });

  const files = JSON.parse(project.versions[0].files) as Record<string, string>;
  const html = buildStandaloneHtml(files, project.name);
  const appId = `com.thatcode.${toId(project.name)}`;
  const pkgName = toPkg(project.name);
  const appName = project.name;

  const zip = new JSZip();
  const root = zip.folder(pkgName)!;

  // ── www/ — the actual web app ──────────────────────────────────────────────
  const www = root.folder("www")!;
  www.file("index.html", html);
  www.file("manifest.json", JSON.stringify({
    name: appName,
    short_name: appName.split(" ")[0],
    start_url: ".",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#8b5cf6",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }, null, 2));

  // Placeholder icon SVG (stores need real PNG — instructions cover this)
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="80" fill="#8b5cf6"/><text x="256" y="340" font-size="260" text-anchor="middle" fill="white" font-family="system-ui">${appName.slice(0,1).toUpperCase()}</text></svg>`;
  const icons = www.folder("icons")!;
  icons.file("icon.svg", iconSvg);
  icons.file("README.txt", "Replace icon-192.png and icon-512.png with your real app icon PNGs.\nFree tool: https://www.appicon.co — upload one 1024x1024 PNG and download all sizes.");

  // ── Capacitor config ───────────────────────────────────────────────────────
  root.file("capacitor.config.json", JSON.stringify({
    appId,
    appName,
    webDir: "www",
    server: { androidScheme: "https" },
  }, null, 2));

  // ── package.json ───────────────────────────────────────────────────────────
  root.file("package.json", JSON.stringify({
    name: pkgName,
    version: "1.0.0",
    private: true,
    scripts: {
      "add:android": "npx cap add android",
      "add:ios": "npx cap add ios",
      "sync": "npx cap sync",
      "open:android": "npx cap open android",
      "open:ios": "npx cap open ios",
      "cloud:build": "npx eas build --platform all",
      "cloud:android": "npx eas build --platform android",
      "cloud:ios": "npx eas build --platform ios",
    },
    dependencies: {
      "@capacitor/core": "^6.1.0",
      "@capacitor/android": "^6.1.0",
      "@capacitor/ios": "^6.1.0",
    },
    devDependencies: {
      "@capacitor/cli": "^6.1.0",
      "eas-cli": "^10.0.0",
    },
  }, null, 2));

  // ── eas.json (Expo Application Services cloud build) ──────────────────────
  root.file("eas.json", JSON.stringify({
    cli: { version: ">= 10.0.0" },
    build: {
      preview: {
        android: { buildType: "apk" },
        ios: { simulator: true },
      },
      production: {
        android: { buildType: "app-bundle" },
        ios: {},
      },
    },
    submit: {
      production: {
        android: { serviceAccountKeyPath: "./google-service-account.json", track: "internal" },
        ios: { appleId: "YOUR_APPLE_ID@example.com", ascAppId: "YOUR_ASC_APP_ID", appleTeamId: "YOUR_APPLE_TEAM_ID" },
      },
    },
  }, null, 2));

  // ── .gitignore ─────────────────────────────────────────────────────────────
  root.file(".gitignore", `node_modules/
android/
ios/
*.apk
*.ipa
`);

  // ── INSTRUCTIONS.md ────────────────────────────────────────────────────────
  root.file("INSTRUCTIONS.md", `# ${appName} — App Store Export

Your app is ready to submit to the App Store and Google Play.
Choose **Option A** (easiest, no Mac needed) or **Option B** (local build).

---

## What you need first

| Store | Requirement | Cost | Link |
|-------|------------|------|------|
| Google Play | Google Play Developer account | $25 one-time | play.google.com/console |
| App Store (iOS) | Apple Developer account | $99/year | developer.apple.com |
| Both (cloud build) | Expo account (free) | Free | expo.dev |

---

## Option A — Cloud Build with EAS (No Mac Required) ⭐ Recommended

You submit from your browser. EAS compiles the app on their servers.

### Step 1 — Install tools
\`\`\`bash
# Install Node.js first if you don't have it: nodejs.org
npm install
npm install -g eas-cli
\`\`\`

### Step 2 — Set up Capacitor
\`\`\`bash
npm run add:android   # adds android/ folder
npm run add:ios       # adds ios/ folder
npm run sync          # copies www/ into native projects
\`\`\`

### Step 3 — Sign in to Expo
\`\`\`bash
eas login
eas build:configure   # follow the prompts, links your Expo account
\`\`\`

### Step 4 — Add your app icon
- Go to https://www.appicon.co
- Upload a 1024x1024 PNG of your icon
- Download and replace the files in \`www/icons/\`

### Step 5 — Build in the cloud
\`\`\`bash
npm run cloud:android   # builds .aab for Google Play
npm run cloud:ios       # builds .ipa for App Store
\`\`\`
EAS will give you a link to download the built files. Takes ~10 minutes.

### Step 6 — Submit
- **Google Play**: Upload the .aab in play.google.com/console → Create app → Production
- **App Store**: Upload the .ipa using Transporter app (free on Mac App Store) or Apple's web uploader

---

## Option B — Local Build (requires Mac for iOS)

### Android (Windows or Mac)
1. Install Android Studio: developer.android.com/studio
2. Run: \`npm install && npm run add:android && npm run sync\`
3. Run: \`npm run open:android\` — Android Studio opens
4. In Android Studio: Build → Generate Signed Bundle/APK → follow wizard
5. Upload the .aab to Google Play Console

### iOS (Mac only)
1. Install Xcode from the Mac App Store
2. Run: \`npm install && npm run add:ios && npm run sync\`
3. Run: \`npm run open:ios\` — Xcode opens
4. In Xcode: Product → Archive → Distribute App → App Store Connect
5. Apple reviews your app (1-3 days)

---

## App ID & Name

Your app is currently configured as:
- **App ID**: \`${appId}\`
- **App Name**: \`${appName}\`

To change these, edit \`capacitor.config.json\`.

---

## Updating your app

When you make changes in ThatCode, export again and replace \`www/index.html\`.
Then run \`npm run sync\` and rebuild.

---

## Need help?

- Capacitor docs: capacitorjs.com/docs
- EAS Build docs: docs.expo.dev/build/introduction
- ThatCode: thatcode.dev
`);

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

  return new Response(zipBuffer as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${pkgName}-app-export.zip"`,
    },
  });
}
