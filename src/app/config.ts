import { DEPLOYMENT_URL } from "vercel-url";

const ACCOUNT_ID = "RHEA"

// Set the plugin url in order of BITTE_CONFIG, env, DEPLOYMENT_URL (used for Vercel deployments)
const PLUGIN_URL = DEPLOYMENT_URL || `${process.env.NEXT_PUBLIC_HOST || 'localhost'}:${process.env.PORT || 3000}`;

if (!PLUGIN_URL) {
  console.error(
    "!!! Plugin URL not found in env, BITTE_CONFIG or DEPLOYMENT_URL !!!"
  );
  process.exit(1);
}

const RHEA_LENDING_INTERFACE_DOMAIN = "https://api.burrow.finance"
export { ACCOUNT_ID, PLUGIN_URL, RHEA_LENDING_INTERFACE_DOMAIN };
